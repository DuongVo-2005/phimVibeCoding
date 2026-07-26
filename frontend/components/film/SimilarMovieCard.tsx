import Image from 'next/image';
import Link from 'next/link';

/**
 * SimilarMovieCard — khớp mục "Nội dung tương tự" trong `design/moviedentail.html`. D3: tạo
 * component RIÊNG thay vì mở rộng `MovieCard` thêm biến thể thứ 4 — overlay ở đây khác cả 3 biến
 * thể hiện có của `MovieCard` (chuỗi rating ghép sẵn "X.X IMDb", nút "CHI TIẾT" đơn, chỉ hiện khi
 * hover ở desktop nhưng LUÔN hiện label đơn giản ở mobile — không giống bất kỳ biến thể nào của
 * `MovieCard`). Chỉ presentational, không fetch/API.
 *
 * Phase 16C: chuẩn hoá hover theo pattern "Movie Card" dùng chung (scale ảnh nhẹ `scale-105` +
 * overlay + shadow `movie-card-glow`, `duration-300 ease-out`) — trước đây `scale-110`/
 * `duration-500` lệch so với `MovieCard`.
 */
export function SimilarMovieCard({
  title,
  rating,
  imageSrc,
  href = '#',
}: {
  title: string;
  rating: string;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-[2/3] rounded-[20px] overflow-hidden border border-white/5 block movie-card-glow transition-shadow duration-300 ease-out"
    >
      <Image
        src={imageSrc}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />

      {/* Mobile: label luôn hiện, không cần hover */}
      <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
        <span className="text-xs text-white">{title}</span>
      </div>

      {/* Desktop: overlay đầy đủ, chỉ hiện khi hover */}
      <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex-col justify-end p-md">
        <p className="text-primary font-bold text-label-md mb-1">{rating} IMDb</p>
        <h4 className="text-white font-bold leading-tight">{title}</h4>
        <span className="mt-sm w-full py-2 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white text-center">
          CHI TIẾT
        </span>
      </div>
    </Link>
  );
}
