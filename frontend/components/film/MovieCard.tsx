import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * MovieCard (placeholder) — khớp pattern poster `aspect-[2/3] rounded-[20px] overflow-hidden`
 * lặp lại trong design/*.html. CHỈ presentational: không fetch dữ liệu, không gọi API — props do
 * nơi gọi truyền vào. design/homepage.html có 2 biến thể dùng chung khung poster này: mục "Đang
 * thịnh hành" hiện tiêu đề+badge khi hover (`showTitle=true`, mặc định), mục "Gợi ý riêng cho bạn"
 * chỉ hiện icon play khi hover, không có tiêu đề (`showTitle=false`) — khớp đúng 2 pattern trong
 * design, không tự thêm biến thể khác.
 */
export function MovieCard({
  title,
  href = '#',
  imageSrc,
  badges,
  showTitle = true,
}: {
  title: string;
  href?: string;
  imageSrc?: string;
  badges?: ReactNode;
  showTitle?: boolean;
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
      {showTitle ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-md">
          <h3 className="font-bold text-headline-md text-white line-clamp-2">{title}</h3>
          {badges ? <div className="flex gap-2 mt-2">{badges}</div> : null}
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
