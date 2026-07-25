import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * MovieCard (placeholder) — khớp pattern poster `aspect-[2/3] rounded-xl overflow-hidden` lặp
 * lại trong design/*.html. CHỈ presentational: không fetch dữ liệu, không gọi API — props do nơi
 * gọi truyền vào.
 *
 * 3 biến thể khớp đúng những gì có trong design, không tự thêm biến thể khác:
 * - `showTitle=true` (mặc định, không `rating`) — design/homepage.html mục "Đang thịnh hành":
 *   hiện tiêu đề + `badges` (trong overlay, chỉ khi hover).
 * - `showTitle=false` — design/homepage.html mục "Gợi ý riêng cho bạn": chỉ icon play khi hover.
 * - `showTitle=true` kèm `rating`/`genreLine` — design/moviecategory.html: overlay đầy đủ
 *   tiêu đề + điểm đánh giá + dòng thể loại + nút hành động (`showActions`). `cornerBadge` là nhãn
 *   luôn hiển thị góc phải trên (vd. "4K HDR"), khác vị trí với `badges` (chỉ hiện trong overlay
 *   khi hover, dùng ở homepage).
 */
export function MovieCard({
  title,
  href = '#',
  imageSrc,
  badges,
  cornerBadge,
  showTitle = true,
  rating,
  genreLine,
  showActions = false,
}: {
  title: string;
  href?: string;
  imageSrc?: string;
  badges?: ReactNode;
  cornerBadge?: ReactNode;
  showTitle?: boolean;
  rating?: string;
  genreLine?: string;
  showActions?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block min-w-[140px] aspect-[2/3] relative rounded-[20px] overflow-hidden group movie-card-glow transition-all duration-300 bg-surface-container-high"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 140px, 240px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
            movie
          </span>
        </div>
      )}

      {cornerBadge ? <div className="absolute top-md right-md z-20">{cornerBadge}</div> : null}

      {showTitle ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-md">
          <h3 className="font-bold text-headline-md text-white line-clamp-2">{title}</h3>
          {rating || genreLine ? (
            <div className="flex items-center gap-base mb-sm mt-1 text-xs">
              {rating ? <span className="text-primary font-bold">{rating}</span> : null}
              {genreLine ? (
                <span className="text-on-surface-variant">
                  {rating ? '• ' : ''}
                  {genreLine}
                </span>
              ) : null}
            </div>
          ) : null}
          {badges ? <div className="flex gap-2 mt-2">{badges}</div> : null}
          {showActions ? (
            <div className="flex gap-sm mt-2">
              <span className="flex-1 py-xs bg-white text-black rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs">
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  play_arrow
                </span>
                Xem ngay
              </span>
              <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  add
                </span>
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[32px]" aria-hidden="true">
            play_circle
          </span>
          <span className="sr-only">{title}</span>
        </div>
      )}
    </Link>
  );
}
