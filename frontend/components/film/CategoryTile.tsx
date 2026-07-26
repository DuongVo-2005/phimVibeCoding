import Image from 'next/image';
import Link from 'next/link';

/**
 * CategoryTile — khớp ô trong "Khám phá Thể loại" (bento grid) trong design/homepage.html.
 *
 * Phase 16A: bọc trong `Link` tới `/the-loai/:slug` (trước đây `<div>` trang trí, `cursor-pointer`
 * đánh lừa cảm giác click được nhưng không điều hướng) — tái sử dụng `MovieListing` đã lọc theo
 * `category` (không tạo trang riêng).
 */
export function CategoryTile({
  label,
  slug,
  imageSrc,
  size = 'small',
  overlayClassName = 'bg-black/40 group-hover:bg-black/20',
  className = '',
}: {
  label: string;
  slug: string;
  imageSrc: string;
  size?: 'large' | 'small';
  overlayClassName?: string;
  className?: string;
}) {
  const sizeClasses = size === 'large' ? 'col-span-2 row-span-2 h-64' : 'h-32';

  return (
    <Link
      href={`/the-loai/${slug}`}
      className={`relative block ${sizeClasses} rounded-xl overflow-hidden group ${className}`.trim()}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ease-out z-10 ${overlayClassName}`}
      />
      <Image src={imageSrc} alt={label} fill sizes="25vw" className="object-cover" />
      <span
        className={`absolute z-20 font-bold text-white ${
          size === 'large' ? 'bottom-4 left-4 text-headline-md' : 'bottom-2 left-3 text-label-md'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
