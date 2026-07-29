import { SkeletonBlock } from '@/components/ui/SkeletonBlock';

/**
 * Next.js route-level loading UI cho toàn bộ `(admin)` — tự động hiện khi Next.js đang render
 * Server Component của trang con (vd. đang chờ RSC payload khi điều hướng giữa các trang admin).
 * Không animation (đúng quy ước toàn dự án — xem `SkeletonBlock.tsx`).
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-md" aria-hidden="true">
      <SkeletonBlock className="h-8 w-1/3 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
