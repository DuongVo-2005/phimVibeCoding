'use client';

import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

/**
 * HlsPlayer — Phase 13B: CHỈ mount `<video>` + khởi tạo `hls.js` cho nguồn `m3u8Url`. KHÔNG custom
 * controls (không dựng UI play/pause/seek riêng, cũng KHÔNG bật `controls` mặc định của trình
 * duyệt ở phase này), KHÔNG autoplay, KHÔNG theo dõi progress/pause/ended (History/Resume/Next
 * Episode để phase sau).
 *
 * Backend chưa có field phụ đề (`lib/types/film.ts` — `EpisodeItem` chỉ có `slug/name/embedUrl/
 * m3u8Url`) nên không có `<track>` thật để thêm — không tự bịa file phụ đề giả.
 */
export function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return undefined;
  }, [src]);

  return (
    <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline />
  );
}
