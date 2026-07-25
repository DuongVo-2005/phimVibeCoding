import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';

/** TopRatedListItem — khớp item danh sách "Đánh giá cao" trong design/homepage.html. */
export function TopRatedListItem({
  title,
  score,
  imageSrc,
}: {
  title: string;
  score: string;
  imageSrc: string;
}) {
  return (
    <div className="flex items-center gap-md bg-surface-container/60 p-base rounded-xl hover:translate-x-2 transition-transform cursor-pointer">
      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
        <Image src={imageSrc} alt={title} fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex-grow">
        <h4 className="font-bold text-body-lg">{title}</h4>
        <div className="flex items-center gap-base mt-1">
          <Badge variant="primary" className="bg-primary text-on-primary border-none">
            IMDb
          </Badge>
          <span className="text-primary font-bold text-label-md">{score}</span>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
        chevron_right
      </span>
    </div>
  );
}
