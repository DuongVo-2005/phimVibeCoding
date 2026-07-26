import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

/**
 * TopRatedListItem — khớp item danh sách "Đánh giá cao" trong design/homepage.html.
 *
 * Phase 16A: bọc trong `Link` tới `/phim/:slug` (trước đây chỉ là `<div>` trang trí, `cursor-pointer`
 * đánh lừa cảm giác click được nhưng không có điều hướng nào). `ratingCount === 0` → hiện "Chưa có
 * đánh giá" thay vì "0.0" (ẩn luôn badge "IMDb" — hiện badge cạnh 1 điểm số không tồn tại sẽ gây
 * hiểu nhầm). Hover chuẩn hoá `duration-300 ease-out` (Phase 16C, khoảng 200-300ms dùng chung).
 */
export function TopRatedListItem({
  title,
  score,
  ratingCount,
  imageSrc,
  slug,
}: {
  title: string;
  score: string;
  ratingCount: number;
  imageSrc: string;
  slug: string;
}) {
  return (
    <Link
      href={`/phim/${slug}`}
      className="flex items-center gap-md bg-surface-container/60 p-base rounded-xl hover:translate-x-2 transition-transform duration-300 ease-out"
    >
      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 relative bg-surface-container-high">
        {imageSrc ? (
          <Image src={imageSrc} alt={title} fill sizes="64px" className="object-cover" />
        ) : null}
      </div>
      <div className="flex-grow">
        <h4 className="font-bold text-body-lg">{title}</h4>
        <div className="flex items-center gap-base mt-1">
          {ratingCount > 0 ? (
            <>
              <Badge variant="primary" className="bg-primary text-on-primary border-none">
                IMDb
              </Badge>
              <span className="text-primary font-bold text-label-md">{score}</span>
            </>
          ) : (
            <span className="text-on-surface-variant text-label-md">Chưa có đánh giá</span>
          )}
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
        chevron_right
      </span>
    </Link>
  );
}
