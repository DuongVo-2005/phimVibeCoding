'use client';

import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/layout/Container';
import { EpisodeList } from '@/components/film/EpisodeList';
import { FilmHero } from '@/components/film/FilmHero';
import { SimilarMovieCard } from '@/components/film/SimilarMovieCard';
import { filmsQueryOptions, ratingsQueryOptions } from '@/lib/query/options';

/**
 * FilmDetailView — Phase 11.6A: nối API thật cho phần ĐỌC (Hero/Poster/Metadata/Description/
 * Categories/Cast/Rating summary/Related Movies) qua `filmsQueryOptions.detail/related` +
 * `ratingsQueryOptions.summary`. Phase 11.6B: Episode List cũng đã nối — dùng `film.episodes`
 * thật, lấy items của server ĐẦU TIÊN (`film.episodes[0]`) — Figma không có UI chọn server, không
 * tự thêm (xem `EpisodeList.tsx`, `GridEpisodeItem`, đã refactor khớp backend thật).
 * Favorite/Playlist/Rating input/Country/Director/Comment/History đều NGOÀI phạm vi 11.6.
 * `FilmHero`/`SimilarMovieCard` (presentational) không đổi.
 */
export function FilmDetailView({ slug }: { slug: string }) {
  const { data: film } = useQuery(filmsQueryOptions.detail(slug));
  const { data: related } = useQuery(filmsQueryOptions.related(slug));
  const { data: ratingSummary } = useQuery({
    ...ratingsQueryOptions.summary(film?._id ?? ''),
    enabled: Boolean(film?._id),
  });

  // Chưa có dữ liệu phim (đang tải hoặc không tồn tại) — ẩn toàn bộ trang, đúng pattern đã dùng ở
  // Homepage Phase 11.4 (không skeleton, không UX mới).
  if (!film) {
    return null;
  }

  const similarMovies = related ?? [];
  const primaryServerEpisodes = film.episodes[0]?.items ?? [];

  return (
    <div className="flex flex-col gap-xl">
      <FilmHero
        title={film.title}
        quality={film.quality ?? ''}
        year={film.releaseYear ? String(film.releaseYear) : ''}
        duration={film.duration ?? ''}
        rating={ratingSummary ? ratingSummary.average.toFixed(1) : '—'}
        genres={film.categories.map((category) => category.name)}
        description={film.description ?? ''}
        posterSrc={film.posterUrl ?? film.thumbUrl ?? ''}
        backdropSrc={film.thumbUrl ?? film.posterUrl ?? ''}
        cast={film.actors.map((actor) => ({
          id: actor._id,
          name: actor.name,
          avatarSrc: actor.avatar ?? '',
        }))}
      />

      <Container maxWidth="max-w-screen-2xl" className="flex flex-col gap-xl">
        <EpisodeList episodes={primaryServerEpisodes} />

        {similarMovies.length > 0 ? (
          <section>
            <div className="flex items-center gap-md mb-lg">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">
                Nội dung tương tự
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md">
              {similarMovies.map((movie) => (
                <SimilarMovieCard
                  key={movie._id}
                  title={movie.title}
                  rating={movie.ratingAvg.toFixed(1)}
                  imageSrc={movie.posterUrl ?? movie.thumbUrl ?? ''}
                  href={`/phim/${movie.slug}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
