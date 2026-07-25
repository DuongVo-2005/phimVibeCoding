import { Container } from '@/components/layout/Container';
import { EpisodeList } from '@/components/film/EpisodeList';
import { FilmHero } from '@/components/film/FilmHero';
import { SimilarMovieCard } from '@/components/film/SimilarMovieCard';
import { cast, episodes, filmDetail, similarMovies } from '@/app/(public)/_mock/moviedetail-data';

/**
 * FilmDetailView — nội dung trang chi tiết phim, khớp `design/moviedentail.html`. Route
 * `/phim/[slug]` chỉ có 1 nội dung mock cố định (không suy diễn theo slug — xem comment trong
 * `_mock/moviedetail-data.ts`). KHÔNG gọi API, không state (đúng phạm vi đã xác nhận Phase 10.4).
 */
export function FilmDetailView() {
  return (
    <div className="flex flex-col gap-xl">
      <FilmHero
        title={filmDetail.title}
        quality={filmDetail.quality}
        year={filmDetail.year}
        duration={filmDetail.duration}
        rating={filmDetail.rating}
        genres={filmDetail.genres}
        description={filmDetail.description}
        posterSrc={filmDetail.posterSrc}
        backdropSrc={filmDetail.backdropSrc}
        cast={cast}
      />

      <Container maxWidth="max-w-screen-2xl" className="flex flex-col gap-xl">
        <EpisodeList episodes={episodes} />

        <section>
          <div className="flex items-center gap-md mb-lg">
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Nội dung tương tự</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md">
            {similarMovies.map((movie) => (
              <SimilarMovieCard
                key={movie.id}
                title={movie.title}
                rating={movie.rating}
                imageSrc={movie.imageSrc}
              />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
