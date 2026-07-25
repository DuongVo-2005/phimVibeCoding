import Image from 'next/image';

/** CategoryTile — khớp ô trong "Khám phá Thể loại" (bento grid) trong design/homepage.html. */
export function CategoryTile({
  label,
  imageSrc,
  size = 'small',
  overlayClassName = 'bg-black/40 group-hover:bg-black/20',
  className = '',
}: {
  label: string;
  imageSrc: string;
  size?: 'large' | 'small';
  overlayClassName?: string;
  className?: string;
}) {
  const sizeClasses = size === 'large' ? 'col-span-2 row-span-2 h-64' : 'h-32';

  return (
    <div
      className={`relative ${sizeClasses} rounded-xl overflow-hidden group cursor-pointer ${className}`.trim()}
    >
      <div className={`absolute inset-0 transition-all z-10 ${overlayClassName}`} />
      <Image src={imageSrc} alt={label} fill sizes="25vw" className="object-cover" />
      <span
        className={`absolute z-20 font-bold text-white ${
          size === 'large' ? 'bottom-4 left-4 text-headline-md' : 'bottom-2 left-3 text-label-md'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
