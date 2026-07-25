'use client';

import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/layout/Container';
import { CommentSection } from '@/components/film/CommentSection';
import { EpisodeList } from '@/components/film/EpisodeList';
import { RecommendedCard } from '@/components/film/RecommendedCard';
import { RelatedMovieCard } from '@/components/film/RelatedMovieCard';
import { VideoPlayer } from '@/components/film/VideoPlayer';
import {
  comments,
  commentTotalLabel,
  episodes,
  filmInfo,
  recommendedMovies,
} from '@/app/(public)/_mock/watchmovie-data';
import { filmsQueryOptions, ratingsQueryOptions } from '@/lib/query/options';

/**
 * WatchMovieView — nội dung trang xem phim, khớp `design/watchmovie.html`. Phase 12A: nối API
 * thật CHỈ cho Rating Display + Related Movies (READ ONLY) qua `filmsQueryOptions.detail/related`
 * + `ratingsQueryOptions.summary`. Video Player/Episode List/Comment/Favorite vẫn dùng
 * `_mock/watchmovie-data.ts` — ngoài phạm vi 12A (xem audit Phase 12).
 *
 * D2 (tab mobile): chỉ 1 tab tĩnh "Danh sách tập" được đánh dấu active — design gốc cũng không có
 * logic chuyển nội dung theo tab (JS chỉ đổi màu chữ), nên danh sách tập/bình luận/phim liên quan
 * vẫn hiện tuần tự bên dưới đúng như HTML gốc, không ẩn theo tab.
 *
 * EpisodeList render 2 lần (`layout="list"`) — 1 lần trong sidebar desktop (`hidden lg:block`), 1
 * lần trong khối mobile (`lg:hidden`) vì 2 vị trí này khác thứ tự DOM thật sự (desktop nằm cạnh
 * video, mobile nằm sau phần thông tin phim), không thể chỉ đổi CSS vị trí của cùng 1 node — cùng
 * kỹ thuật 2 nhánh JSX theo breakpoint đã dùng trong `Header`/`EpisodeList` chính nó.
 */
export function WatchMovieView({ slug }: { slug: string }) {
  const { data: film } = useQuery(filmsQueryOptions.detail(slug));
  const { data: related } = useQuery(filmsQueryOptions.related(slug));
  const { data: ratingSummary } = useQuery({
    ...ratingsQueryOptions.summary(film?._id ?? ''),
    enabled: Boolean(film?._id),
  });

  const rating = ratingSummary ? ratingSummary.average.toFixed(1) : '—';
  const relatedMovies = related ?? [];

  return (
    <div className="flex flex-col">
      <Container maxWidth="max-w-[1920px]" className="py-md flex flex-col gap-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-9">
            <VideoPlayer
              backdropSrc={filmInfo.backdropSrc}
              currentTimeLabel={filmInfo.currentTimeLabel}
            />
          </div>
          <div className="hidden lg:block lg:col-span-3 lg:h-[716px] overflow-hidden">
            <EpisodeList episodes={episodes} layout="list" />
          </div>
        </div>

        {/* Mobile: thông tin phim + tab tĩnh (D2) + danh sách tập */}
        <div className="lg:hidden flex flex-col gap-lg">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-headline-lg font-headline-lg text-on-surface">
                {filmInfo.title}
              </h1>
              <div className="flex items-center gap-3 text-on-surface-variant text-body-md">
                <span className="text-primary font-bold">{rating} Rating</span>
                <span>•</span>
                <span>{filmInfo.year}</span>
                <span>•</span>
                <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">
                  {filmInfo.badges[0]}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary"
                aria-label="Lưu lại"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  bookmark
                </span>
              </button>
              <span className="text-[10px] text-on-surface-variant">Lưu lại</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-body-md line-clamp-2 opacity-80">
            {filmInfo.description}
          </p>

          <div className="border-b border-white/5">
            <div className="flex gap-8 overflow-x-auto">
              <span className="pb-2 text-label-md font-label-md text-primary border-b-2 border-primary whitespace-nowrap">
                Danh sách tập
              </span>
              <span className="pb-2 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">
                Bình luận ({commentTotalLabel})
              </span>
              <span className="pb-2 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">
                Thông tin thêm
              </span>
            </div>
          </div>

          <EpisodeList episodes={episodes} layout="list" />
        </div>

        {/* Desktop: thông tin phim + bình luận (8 cột) + đề xuất (4 cột) */}
        <div className="hidden lg:grid grid-cols-12 gap-gutter">
          <div className="col-span-8 flex flex-col gap-lg">
            <section className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-lg rounded-[20px]">
              <div className="flex justify-between items-start mb-base">
                <div>
                  <h1 className="text-headline-xl font-headline-xl text-on-surface">
                    {filmInfo.title}
                  </h1>
                  <div className="flex items-center gap-md mt-xs">
                    <span className="text-primary font-bold">{filmInfo.year}</span>
                    {filmInfo.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-xs py-0.5 bg-surface-container-highest rounded text-[12px] font-bold"
                      >
                        {badge}
                      </span>
                    ))}
                    <span className="flex items-center gap-1 text-primary">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden="true"
                      >
                        star
                      </span>
                      <span className="text-label-md">{rating}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:text-primary transition-colors"
                    aria-label="Thêm vào danh sách"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      add
                    </span>
                  </button>
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:text-primary transition-colors"
                    aria-label="Chia sẻ"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      share
                    </span>
                  </button>
                </div>
              </div>
              <p className="text-body-lg font-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
                {filmInfo.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg pt-lg border-t border-white/10">
                <div>
                  <span className="block text-label-md text-on-surface-variant mb-1">Đạo diễn</span>
                  <span className="text-body-md font-bold">{filmInfo.director}</span>
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant mb-1">
                    Diễn viên
                  </span>
                  <span className="text-body-md font-bold">{filmInfo.cast}</span>
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant mb-1">Thể loại</span>
                  <span className="text-body-md font-bold">{filmInfo.genre}</span>
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant mb-1">
                    Thời lượng
                  </span>
                  <span className="text-body-md font-bold">{filmInfo.duration}</span>
                </div>
              </div>
            </section>

            <CommentSection comments={comments} totalLabel={commentTotalLabel} />
          </div>

          <div className="col-span-4 flex flex-col gap-md">
            <h3 className="text-headline-md font-headline-md text-on-surface">Đề xuất cho bạn</h3>
            <div className="flex flex-col gap-md">
              {recommendedMovies.map((movie) => (
                <RecommendedCard
                  key={movie.id}
                  category={movie.category}
                  title={movie.title}
                  imageSrc={movie.imageSrc}
                />
              ))}
            </div>
          </div>
        </div>

        <section>
          <div className="flex justify-between items-end mb-lg">
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Phim liên quan</h2>
            <button type="button" className="text-primary font-bold hover:underline">
              Xem tất cả
            </button>
          </div>
          <div className="flex gap-gutter overflow-x-auto pb-md">
            {relatedMovies.map((movie) => (
              <RelatedMovieCard
                key={movie._id}
                title={movie.title}
                subtitle={[
                  movie.categories[0]?.name,
                  movie.releaseYear ? String(movie.releaseYear) : null,
                ]
                  .filter((part): part is string => Boolean(part))
                  .join(' • ')}
                imageSrc={movie.posterUrl ?? movie.thumbUrl ?? ''}
                href={`/phim/${movie.slug}`}
              />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
