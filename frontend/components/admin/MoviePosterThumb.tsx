'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * MoviePosterThumb — ảnh poster nhỏ dùng trong `MovieTableRow`/`MovieListCard` (Phase 19B.1).
 * Tách riêng khỏi `components/film/MovieCard.tsx` — component đó có overlay/hover/actions cho
 * trang công khai, không phù hợp kích thước ô bảng admin. Cùng kỹ thuật fallback khi ảnh lỗi
 * (icon "movie") đã dùng ở `MovieCard`.
 */
export function MoviePosterThumb({ src, alt }: { src?: string; alt: string }) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(src) && !imageError;

  return (
    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes="44px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            movie
          </span>
        </div>
      )}
    </div>
  );
}
