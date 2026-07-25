import { WatchMovieView } from '@/components/film/WatchMovieView';

/**
 * Phase 13A: đọc thêm `searchParams` (`?ep=&server=`) ở Server Component thay vì gọi
 * `useSearchParams()` trong `WatchMovieView` — tránh đúng lỗi đã gặp ở Phase 11.1
 * ("useSearchParams() should be wrapped in a suspense boundary") mà không cần thêm `<Suspense>`.
 * `params`/`searchParams` đều là Promise theo Next.js 16.
 */
export default async function WatchFilmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ep?: string | string[]; server?: string | string[] }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const episodeSlug =
    typeof resolvedSearchParams.ep === 'string' ? resolvedSearchParams.ep : undefined;
  const serverIndex =
    typeof resolvedSearchParams.server === 'string' ? resolvedSearchParams.server : undefined;

  return <WatchMovieView slug={slug} episodeSlug={episodeSlug} serverIndex={serverIndex} />;
}
