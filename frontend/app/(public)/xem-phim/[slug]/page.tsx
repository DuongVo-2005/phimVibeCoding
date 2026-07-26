import type { Metadata } from 'next';
import { WatchMovieView } from '@/components/film/WatchMovieView';
import { filmsApi } from '@/lib/api/films';

/**
 * Phase 13A: đọc thêm `searchParams` (`?ep=&server=`) ở Server Component thay vì gọi
 * `useSearchParams()` trong `WatchMovieView` — tránh đúng lỗi đã gặp ở Phase 11.1
 * ("useSearchParams() should be wrapped in a suspense boundary") mà không cần thêm `<Suspense>`.
 * `params`/`searchParams` đều là Promise theo Next.js 16.
 */
// Phase 18: title "Xem phim {title}" — khác `title` trơn của `/phim/[slug]` (cùng phim, tránh 2
// route trùng `<title>`), xem ghi chú `app/(public)/phim/[slug]/page.tsx`.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const film = await filmsApi.bySlug(slug);
    return { title: `Xem phim ${film.title}` };
  } catch {
    return { title: 'Xem phim' };
  }
}

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
