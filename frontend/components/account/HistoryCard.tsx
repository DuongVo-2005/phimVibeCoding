import Image from 'next/image';
import Link from 'next/link';

/**
 * HistoryCard — khớp "Xem tiếp" (bento xem dở) trong `design/userdasboard.html`. Quyết định B
 * (Phase 10.8): tạo component RIÊNG, không mở rộng `MovieCard` — `MovieCard` đang dùng ở nhiều
 * trang (trang chủ, `/phim-le`, `/phim-bo`, `/phim/[slug]`), thêm prop tiến độ vào đó sẽ tăng rủi
 * ro phá các phase đã ổn định. Chỉ dùng ở desktop trong `UserDashboardView` (`hidden md:block`) —
 * design mobile không có mục "Xem tiếp" riêng (chỉ có số liệu tổng trong Stats Row).
 */
export function HistoryCard({
  title,
  badge,
  rating,
  progressPercent,
  imageSrc,
  href = '#',
}: {
  title: string;
  badge: string;
  rating: string;
  progressPercent: number;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[2/3] rounded-xl overflow-hidden shadow-lg"
    >
      <Image
        src={imageSrc}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 w-full p-md translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <h3 className="text-body-md font-bold text-white line-clamp-1">{title}</h3>
        <div className="flex items-center gap-sm mt-xs">
          <span className="bg-white/20 backdrop-blur-md px-sm py-xs rounded text-label-md text-white">
            {badge}
          </span>
          <span className="text-primary text-label-md font-bold">{rating}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
        <div className="h-full bg-secondary-container" style={{ width: `${progressPercent}%` }} />
      </div>
    </Link>
  );
}
