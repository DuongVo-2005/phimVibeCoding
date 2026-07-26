import { SkeletonBlock } from '@/components/ui/SkeletonBlock';

/**
 * MovieCardSkeleton — khớp đúng khung hình `MovieCard` thật (`aspect-[2/3] rounded-[20px]`) để
 * không có CLS khi data về. Dùng chung cho `MovieListing` (grid) và các carousel homepage
 * (Trending/LatestSeries/MostCommented/LatestMovies) — Phase 16C, cùng tinh thần
 * `ContinueWatchingSection`/`TopRatedSection` (Phase 11.4A: skeleton khớp layout thật, không dùng
 * animation).
 */
export function MovieCardSkeleton() {
  return <SkeletonBlock className="min-w-[140px] aspect-[2/3] rounded-[20px]" />;
}
