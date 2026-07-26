import Image from 'next/image';
import Link from 'next/link';

/**
 * FavoriteListItem — khớp mục "Yêu thích" trong `design/userdasboard.html`. Desktop dùng dạng
 * hàng ngang (thumb+tên+thể loại•năm, icon phát khi hover), mobile dùng dạng thẻ poster (chỉ icon
 * phát khi hover, không chữ) — 2 kiểu UI thật sự khác nhau, không chỉ đổi kích thước, nên tách 2
 * nhánh JSX (giống `ActorCard`/`FilmographyCard`) nhưng DÙNG CHUNG 1 nguồn dữ liệu (không tách 2
 * bộ dữ liệu riêng theo breakpoint).
 *
 * Phase 18: `imageSrc` rỗng → ẩn `<Image>` (audit phát hiện Next/Image cảnh báo "empty string" khi
 * `UserDashboardView.tsx` truyền `film.posterUrl ?? film.thumbUrl ?? ''` mà cả 2 đều rỗng).
 */
export function FavoriteListItem({
  title,
  genre,
  year,
  imageSrc,
  href = '#',
}: {
  title: string;
  genre: string;
  year: string;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group block">
      {/* Desktop: hàng ngang */}
      <div className="hidden md:flex items-center gap-md p-sm bg-white/5 rounded-xl hover:bg-white/10 transition-all">
        <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
          {imageSrc ? (
            <Image src={imageSrc} alt={title} fill sizes="64px" className="object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors truncate">
            {title}
          </h4>
          <p className="text-label-md text-on-surface-variant truncate">
            {genre} • {year}
          </p>
        </div>
        <span
          className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          play_circle
        </span>
      </div>

      {/* Mobile: thẻ poster, chỉ icon phát khi hover */}
      <div className="md:hidden flex-none w-32">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-high">
          {imageSrc ? (
            <Image src={imageSrc} alt={title} fill sizes="128px" className="object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              play_circle
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
