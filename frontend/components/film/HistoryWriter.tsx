'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { apiBaseUrl } from '@/lib/api/client';
import { HISTORIES_ENDPOINTS } from '@/lib/api/endpoints';
import { historiesApi } from '@/lib/api/histories';
import type { UpdateHistoryInput } from '@/lib/types/history';

const WRITE_INTERVAL_MS = 15_000;

/**
 * HistoryWriter — Phase 13C: GHI `POST /histories` theo sự kiện của element `<video>` thật. Tách
 * riêng khỏi `HlsPlayer` theo đúng yêu cầu (`WatchMovieView` truyền `videoElement` lấy được qua
 * `onVideoRef`, không nhét logic ghi lịch sử vào component player). CHỈ hỗ trợ `playerType ===
 * 'hls'` — nơi gọi (`WatchMovieView`) chỉ mount component này khi có `<video>` thật; `IframePlayer`
 * không có sự kiện phát để theo dõi nên không bao giờ có `videoElement`.
 *
 * CHỈ GHI — không đọc `GET /histories/*`, không seek, không resume `currentTime`, không tự chuyển
 * tập. Component không render UI (`return null`).
 *
 * Event mapping:
 * - `play` → bắt đầu interval ghi định kỳ (15s, KHÔNG debounce).
 * - `pause` → dừng interval, ghi ngay 1 lần (chốt đúng vị trí dừng).
 * - `ended` → dừng interval, ghi ngay 1 lần (progress = tiến độ thật tại thời điểm kết thúc).
 * - `beforeunload`/`pagehide` → ghi ngay qua `fetch(..., { keepalive: true })` (xem `writeOnExit`
 *   bên dưới) — NGOẠI LỆ có chủ đích thay cho `navigator.sendBeacon()`: Beacon API không hỗ trợ
 *   header tuỳ ý, trong khi `POST /histories` bắt buộc `Authorization: Bearer`. `keepalive: true`
 *   cho `fetch` có cùng đảm bảo "request sống sót qua lúc trang đóng" như `sendBeacon`, nhưng vẫn
 *   gửi được header thật. Payload/endpoint/cơ chế auth giống hệt 3 điểm ghi còn lại — không đổi gì
 *   khác ngoài cách gửi request ở đúng bước này.
 */
export function HistoryWriter({
  videoElement,
  filmId,
  episodeSlug,
  serverName,
}: {
  videoElement: HTMLVideoElement | null;
  filmId: string;
  episodeSlug: string;
  serverName: string;
}) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!videoElement || !accessToken) {
      return undefined;
    }

    const buildPayload = (): UpdateHistoryInput => ({
      film: filmId,
      episodeSlug,
      serverName,
      progressSeconds: Math.floor(videoElement.currentTime),
      totalDurationSeconds: Number.isFinite(videoElement.duration)
        ? Math.floor(videoElement.duration)
        : 0,
    });

    const write = () => {
      historiesApi.update(buildPayload(), accessToken).catch(() => undefined);
    };

    const writeOnExit = () => {
      fetch(`${apiBaseUrl}${HISTORIES_ENDPOINTS.update}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
        keepalive: true,
      }).catch(() => undefined);
    };

    let intervalId: number | undefined;

    const stopInterval = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handlePlay = () => {
      if (intervalId === undefined) {
        intervalId = window.setInterval(write, WRITE_INTERVAL_MS);
      }
    };
    const handlePause = () => {
      stopInterval();
      write();
    };
    const handleEnded = () => {
      stopInterval();
      write();
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    window.addEventListener('beforeunload', writeOnExit);
    window.addEventListener('pagehide', writeOnExit);

    return () => {
      stopInterval();
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      window.removeEventListener('beforeunload', writeOnExit);
      window.removeEventListener('pagehide', writeOnExit);
    };
  }, [videoElement, accessToken, filmId, episodeSlug, serverName]);

  return null;
}
