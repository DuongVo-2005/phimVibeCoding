import Image from 'next/image';
import Link from 'next/link';

/**
 * ActorCard — khớp `design/actorderectory.html`. Quyết định B (Phase 10.6): 2 nhánh JSX riêng
 * theo breakpoint, KHÔNG đồng bộ nội dung — desktop hiện đủ ảnh/tên/quốc gia/số phim (overlay khi
 * hover), mobile CHỈ ảnh + tên (đúng như design gốc: bản mobile không có overlay quốc gia/số
 * phim). Chỉ presentational, không fetch/API, `href` mặc định `"#"` (cùng quy ước `MovieCard`/
 * `SimilarMovieCard`/`RelatedMovieCard`/`RecommendedCard`).
 */
export function ActorCard({
  name,
  country,
  filmCountLabel,
  imageSrc,
  href = '#',
}: {
  name: string;
  country: string;
  filmCountLabel: string;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group block">
      {/* Desktop: ảnh + overlay hover (quốc gia/tên/số phim) */}
      <div className="hidden md:block relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] transition-transform duration-500 group-hover:scale-[1.03]">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 1280px) 25vw, 20vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-300">
          <span className="text-xs uppercase tracking-widest text-primary font-bold mb-1">
            {country}
          </span>
          <h3 className="text-headline-md font-headline-md text-white">{name}</h3>
          <p className="text-on-surface-variant/80 text-sm line-clamp-1">{filmCountLabel}</p>
        </div>
      </div>

      {/* Mobile: chỉ ảnh + tên, không overlay */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-container">
          <Image src={imageSrc} alt={name} fill sizes="33vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        </div>
        <p className="text-label-md font-label-md text-on-surface truncate px-1">{name}</p>
      </div>
    </Link>
  );
}
