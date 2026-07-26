'use client';

import { useEffect, useRef } from 'react';

/**
 * HistoryResume — Phase 13D: khôi phục vị trí phát từ History đã lưu. Tách khỏi `HlsPlayer`, cùng
 * nguyên tắc đã áp dụng cho `HistoryWriter` (Phase 13C) — nhận `videoElement` từ ngoài, không tự
 * mount `<video>`.
 *
 * CHỈ seek — không đọc thêm gì khác ngoài `progressSeconds` được truyền vào, không ghi History,
 * không tự chuyển tập, không auto next. `WatchMovieView` chỉ truyền `progressSeconds` khác `null`
 * khi tập đang phát TRÙNG `episodeSlug` đã lưu trong History — seek theo tiến độ đo trên timeline
 * của MỘT tập khác sẽ sai, nên component này không tự kiểm tra lại điều đó.
 *
 * Chỉ seek đúng 1 lần trong vòng đời component (`hasSeekedRef`, không reset): nếu video đã đạt
 * `readyState >= HAVE_METADATA` ngay khi effect chạy (tải nhanh, sự kiện `loadedmetadata` có thể
 * đã bắn trước khi History kịp fetch xong), seek ngay lập tức; nếu chưa, đợi sự kiện
 * `loadedmetadata` — không seek lặp lại sau đó dù `videoElement`/`progressSeconds` có đổi tiếp.
 */
export function HistoryResume({
  videoElement,
  progressSeconds,
}: {
  videoElement: HTMLVideoElement | null;
  progressSeconds: number | null;
}) {
  const hasSeekedRef = useRef(false);

  // `videoElement` là node DOM thật (không phải app state) — gán `.currentTime` là API chuẩn của
  // HTMLMediaElement để seek, không phải mutation dữ liệu ứng dụng mà rule này nhắm tới.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (hasSeekedRef.current || !videoElement || progressSeconds === null || progressSeconds <= 0) {
      return undefined;
    }

    const seekOnce = () => {
      if (hasSeekedRef.current) {
        return;
      }
      hasSeekedRef.current = true;
      // eslint-disable-next-line react-hooks/immutability -- xem giải thích ở trên useEffect
      videoElement.currentTime = progressSeconds;
    };

    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      seekOnce();
      return undefined;
    }

    videoElement.addEventListener('loadedmetadata', seekOnce);
    return () => {
      videoElement.removeEventListener('loadedmetadata', seekOnce);
    };
  }, [videoElement, progressSeconds]);

  return null;
}
