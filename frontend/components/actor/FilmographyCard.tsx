import Image from 'next/image';
import Link from 'next/link';

/**
 * FilmographyCard — khớp "Tác phẩm nổi bật" trong `design/actorprofile.html`. Quyết định B (Phase
 * 10.7): tạo component RIÊNG — không mở rộng `MovieCard` (không có biến thể nào của nó có badge
 * rating góc trên LUÔN hiện) và không mở rộng `SimilarMovieCard` (overlay của nó có nút "CHI
 * TIẾT", khác hoàn toàn overlay chỉ có tiêu đề + năm/thể loại ở đây). Chỉ presentational.
 *
 * 2 nhánh JSX theo breakpoint (giống `ActorCard`): desktop chỉ overlay khi hover (không badge),
 * mobile badge rating luôn hiện (nếu có) + caption luôn hiện dưới poster — đúng design gốc.
 */
export function FilmographyCard({
  title,
  year,
  genre,
  imageSrc,
  rating,
  href = '#',
}: {
  title: string;
  year: string;
  genre: string;
  imageSrc: string;
  rating?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group block shrink-0 w-40 md:w-[200px]">
      {/* Desktop: overlay chỉ hiện khi hover, không badge rating */}
      <div className="hidden md:block relative aspect-[2/3] rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <Image src={imageSrc} alt={title} fill sizes="200px" className="object-cover" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col justify-end p-md backdrop-blur-sm">
          <h3 className="text-label-md font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface/70">
            {year} • {genre}
          </p>
        </div>
      </div>

      {/* Mobile: badge rating luôn hiện + caption luôn hiện dưới poster */}
      <div className="md:hidden">
        <div className="relative aspect-[2/3] rounded-[20px] overflow-hidden">
          <Image src={imageSrc} alt={title} fill sizes="160px" className="object-cover" />
          {rating ? (
            <span className="absolute top-2 right-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-primary">
              {rating}
            </span>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="text-on-surface font-label-md text-label-md truncate">{title}</div>
          <div className="text-on-surface-variant text-xs opacity-60">
            {year} • {genre}
          </div>
        </div>
      </div>
    </Link>
  );
}
