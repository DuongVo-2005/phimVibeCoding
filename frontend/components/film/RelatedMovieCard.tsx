import Image from 'next/image';
import Link from 'next/link';

/**
 * RelatedMovieCard — khớp mục "Phim liên quan" trong `design/watchmovie.html`. D3: tạo component
 * RIÊNG thay vì mở rộng `MovieCard`/`SimilarMovieCard` — overlay ở đây có 2 nút hành động đầy đủ
 * chiều rộng ("Xem ngay" + "Thêm vào DS"), khác cả 3 biến thể của `MovieCard` và overlay 1 nút của
 * `SimilarMovieCard`. Chỉ presentational, không fetch/API.
 *
 * Phase 18: `imageSrc` rỗng → ẩn `<Image>` (audit phát hiện Next/Image cảnh báo "empty string" khi
 * phim không có cả `posterUrl` lẫn `thumbUrl`).
 */
export function RelatedMovieCard({
  title,
  subtitle,
  imageSrc,
  href = '#',
}: {
  title: string;
  subtitle: string;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group block w-40 md:w-48 shrink-0">
      <div className="relative aspect-[2/3] rounded-[20px] overflow-hidden shadow-lg mb-2 md:mb-base bg-surface-container-high">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 40vw, 192px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-base backdrop-blur-sm">
          <span className="bg-primary text-on-primary w-full py-xs rounded-lg font-bold text-sm mb-xs text-center">
            Xem ngay
          </span>
          <span className="bg-white/[0.03] backdrop-blur-xl border border-white/10 w-full py-xs rounded-lg font-bold text-sm text-center">
            Thêm vào DS
          </span>
        </div>
      </div>
      <h4 className="text-body-md font-bold text-on-surface truncate">{title}</h4>
      <span className="text-label-md text-on-surface-variant">{subtitle}</span>
    </Link>
  );
}
