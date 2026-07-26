import Image from 'next/image';
import Link from 'next/link';

/**
 * RecommendedCard — khớp mục "Đề xuất cho bạn" (sidebar desktop) trong `design/watchmovie.html`.
 * D4: tạo component RIÊNG — tỉ lệ 16:9, nhãn thể loại + tiêu đề LUÔN hiện (không cần hover), khác
 * mọi biến thể của `MovieCard`/`SimilarMovieCard`/`RelatedMovieCard`. Chỉ presentational.
 */
export function RecommendedCard({
  category,
  title,
  imageSrc,
  href = '#',
}: {
  category: string;
  title: string;
  imageSrc: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-video rounded-xl overflow-hidden block bg-white/[0.03] backdrop-blur-xl border border-white/10 scale-100 hover:scale-[1.02] transition-transform duration-300 ease-out"
    >
      <Image
        src={imageSrc}
        alt={title}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 p-md">
        <span className="block text-label-md text-primary font-bold mb-1">{category}</span>
        <h4 className="text-headline-md font-headline-md text-on-surface">{title}</h4>
      </div>
    </Link>
  );
}
