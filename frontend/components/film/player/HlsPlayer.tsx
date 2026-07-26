'use client';

import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

/**
 * HlsPlayer — Phase 13B: CHỈ mount `<video>` + khởi tạo `hls.js` cho nguồn `m3u8Url`. KHÔNG custom
 * controls (không dựng UI play/pause/seek riêng, cũng KHÔNG bật `controls` mặc định của trình
 * duyệt ở phase này), KHÔNG autoplay, KHÔNG theo dõi progress/pause/ended trực tiếp trong file này
 * (xem `HistoryWriter.tsx`, Phase 13C — tách riêng theo đúng yêu cầu, không nhét logic ghi lịch sử
 * vào component player).
 *
 * Backend chưa có field phụ đề (`lib/types/film.ts` — `EpisodeItem` chỉ có `slug/name/embedUrl/
 * m3u8Url`) nên không có `<track>` thật để thêm — không tự bịa file phụ đề giả.
 *
 * Phase 13C: nhận thêm `onVideoRef` — callback ref để `WatchMovieView` lấy được element `<video>`
 * thật, truyền cho `HistoryWriter` theo dõi sự kiện play/pause/ended (không đọc DOM trực tiếp từ
 * bên ngoài, không dùng `document.querySelector`).
 *
 * Phase 18: bắt lỗi phát thật (audit phát hiện — trước đây `hls.js` không có listener
 * `Hls.Events.ERROR` nào, stream lỗi (404/CORS/hỏng) khiến player đơ/đen im lặng, không có
 * `ErrorState`/nút thử lại như MỌI nơi gọi API khác trong app). Chỉ coi là lỗi khi `data.fatal`
 * (đúng khuyến nghị chính thức của hls.js — lỗi không-fatal tự phục hồi, không nên làm gián đoạn
 * người xem). `<video>` LUÔN giữ mounted (kể cả khi lỗi) để `videoRef`/`onVideoRef` không bị mất —
 * `ErrorState` chỉ overlay lên trên, nút "Thử lại" tăng `retryKey` để effect chạy lại từ đầu
 * (`hls.loadSource`/`attachMedia` mới, không phải reload cả trang).
 */
export function HlsPlayer({
  src,
  onVideoRef,
}: {
  src: string;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isError, setIsError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setIsError(true);
        }
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const handleNativeError = () => setIsError(true);
      video.addEventListener('error', handleNativeError);

      return () => {
        video.removeEventListener('error', handleNativeError);
      };
    }

    return undefined;
  }, [src, retryKey]);

  const setVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    onVideoRef?.(node);
  };

  const handleRetry = () => {
    setIsError(false);
    setRetryKey((key) => key + 1);
  };

  return (
    <div className="absolute inset-0">
      <video
        ref={setVideoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
      />
      {isError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <ErrorState message="Không thể phát video này." onRetry={handleRetry} />
        </div>
      ) : null}
    </div>
  );
}
