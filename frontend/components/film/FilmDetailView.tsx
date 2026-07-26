'use client';

import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/layout/Container';
import { CommentSection } from '@/components/film/CommentSection';
import { EpisodeList } from '@/components/film/EpisodeList';
import { FilmHero } from '@/components/film/FilmHero';
import { SimilarMovieCard } from '@/components/film/SimilarMovieCard';
import { useComment } from '@/hooks/useComment';
import { useFavorite } from '@/hooks/useFavorite';
import { useRating } from '@/hooks/useRating';
import { filmsQueryOptions } from '@/lib/query/options';

/**
 * FilmDetailView — Phase 11.6A: nối API thật cho phần ĐỌC (Hero/Poster/Metadata/Description/
 * Categories/Cast/Related Movies) qua `filmsQueryOptions.detail/related`. Phase 11.6B: Episode
 * List cũng đã nối — dùng `film.episodes` thật, lấy items của server ĐẦU TIÊN
 * (`film.episodes[0]`) — Figma không có UI chọn server, không tự thêm (xem `EpisodeList.tsx`,
 * `GridEpisodeItem`, đã refactor khớp backend thật). Playlist/Country/Director/History đều NGOÀI
 * phạm vi.
 *
 * Phase 14A: Favorite đã nối thật qua `useFavorite('film', film._id)` (xem `hooks/useFavorite.ts`)
 * — truyền `isFavorited`/`onToggleFavorite` xuống `FilmHero`.
 *
 * Phase 14B: Rating summary + Rating Input đã gộp vào `useRating('film._id')` (xem
 * `hooks/useRating.ts`, thay cho `ratingsQueryOptions.summary` gọi trực tiếp trước đây) — truyền
 * `rating`/`myRating`/`onSelectRating` xuống `FilmHero`.
 *
 * Phase 14C: thêm `CommentSection` (component đã có sẵn từ Watch Page, KHÔNG tạo bản mới) — Movie
 * Detail trước đây KHÔNG có phần bình luận (ngoài phạm vi Phase 11.6, Figma `moviedentail.html`
 * cũng không có), phase này yêu cầu tường minh Comment Mutation dùng chung cho CẢ 2 trang nên mount
 * thêm ở đây, dữ liệu qua `useComment(film._id)` (cùng hook với Watch Page).
 *
 * `FilmHero`/`SimilarMovieCard`/`CommentSection` (presentational) không đổi cấu trúc nội bộ, chỉ
 * nhận thêm prop tuỳ chọn hoặc được mount thêm.
 */
export function FilmDetailView({ slug }: { slug: string }) {
  const { data: film } = useQuery(filmsQueryOptions.detail(slug));
  const { data: related } = useQuery(filmsQueryOptions.related(slug));
  const {
    isFavorited,
    toggle: toggleFavorite,
    isPending: isFavoritePending,
  } = useFavorite('film', film?._id ?? '');
  const {
    average: ratingAverage,
    myRating,
    setRating,
    isPending: isRatingPending,
  } = useRating(film?._id ?? '');
  const {
    comments,
    sendComment,
    totalLabel: commentTotalLabel,
    isPending: isCommentPending,
  } = useComment(film?._id ?? '');

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
        rating={ratingAverage !== null ? ratingAverage.toFixed(1) : '—'}
        genres={film.categories.map((category) => category.name)}
        description={film.description ?? ''}
        posterSrc={film.posterUrl ?? film.thumbUrl ?? ''}
        backdropSrc={film.thumbUrl ?? film.posterUrl ?? ''}
        cast={film.actors.map((actor) => ({
          id: actor._id,
          name: actor.name,
          avatarSrc: actor.avatar ?? '',
        }))}
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        isFavoritePending={isFavoritePending}
        myRating={myRating}
        onSelectRating={setRating}
        isRatingPending={isRatingPending}
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

        <CommentSection
          comments={comments}
          totalLabel={commentTotalLabel}
          onSubmit={sendComment}
          disabled={isCommentPending}
        />
      </Container>
    </div>
  );
}
