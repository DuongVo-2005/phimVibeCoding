'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { CommentSection } from '@/components/film/CommentSection';
import { EpisodeList, type ListEpisodeItem } from '@/components/film/EpisodeList';
import { HistoryResume } from '@/components/film/HistoryResume';
import { HistoryWriter } from '@/components/film/HistoryWriter';
import { RatingInput } from '@/components/film/RatingInput';
import { RecommendedCard } from '@/components/film/RecommendedCard';
import { RelatedMovieCard } from '@/components/film/RelatedMovieCard';
import { VideoPlayer } from '@/components/film/VideoPlayer';
import { filmInfo, recommendedMovies } from '@/app/(public)/_mock/watchmovie-data';
import { useComment } from '@/hooks/useComment';
import { useFavorite } from '@/hooks/useFavorite';
import { useRating } from '@/hooks/useRating';
import { filmsQueryOptions, historiesQueryOptions } from '@/lib/query/options';
import { resolvePlaybackState } from '@/lib/watch/playback-state';
import { buildWatchUrl } from '@/lib/watch/url';

/**
 * WatchMovieView — nội dung trang xem phim, khớp `design/watchmovie.html`. Phase 12A: nối API
 * thật cho Rating Display + Related Movies. Phase 12C: nối API thật cho Comment Section (READ
 * ONLY, sau này gộp vào `useComment` ở Phase 14C). Reply/Vote/Edit/Delete/Pagination/Infinite
 * Scroll KHÔNG làm — `CommentSection` (presentational) không đổi cấu trúc.
 *
 * Phase 14A: 2 nút Favorite (mobile "Lưu lại", desktop "Thêm vào danh sách") nối thật qua
 * `useFavorite('film', film._id)` — dùng CHUNG hook với Movie Detail (`FilmHero`). KHÔNG đổi
 * icon/text — chỉ toggle `fontVariationSettings` FILL trên cùng icon để phản ánh trạng thái.
 *
 * Phase 14B: Rating summary đã gộp vào `useRating(film._id)` (thay `ratingsQueryOptions.summary`
 * gọi trực tiếp) — cùng hook với Movie Detail. Thêm `RatingInput` (component MỚI dùng chung, xem
 * `RatingInput.tsx`) ở cả khối mobile lẫn desktop. Playlist vẫn NGOÀI phạm vi.
 *
 * Phase 14C: gửi bình luận đã hoạt động thật qua `useComment(film._id)` (thay
 * `commentsQueryOptions.byFilm` gọi trực tiếp) — cùng hook với Movie Detail, `onSubmit={sendComment}`
 * truyền xuống `CommentSection`. Reply/Vote/Edit/Delete vẫn NGOÀI phạm vi.
 *
 * Phase 13A: nhận thêm `episodeSlug`/`serverIndex` (đọc từ `?ep=&server=` ở page.tsx, xem
 * `lib/watch/playback-state.ts`) — derive `PlaybackState` từ `film.episodes` + 2 param này (không
 * lưu state riêng). Phase 13B: truyền `playerType`/`currentVideoUrl` xuống `VideoPlayer` →
 * `PlayerResolver` (`components/film/player/`) mount `HlsPlayer`/`IframePlayer`/`EmptyPlayer` thật.
 *
 * Phase 13C: `videoElement` (state duy nhất thêm ở phase này — lấy qua `onVideoRef` callback ref
 * từ `HlsPlayer`, KHÔNG phải state trùng lặp với `PlaybackState`) truyền cho `HistoryWriter` — CHỈ
 * mount khi `playerType === 'hls'` (`IframePlayer` không ghi progress). `HistoryWriter` tự
 * GHI `POST /histories` theo sự kiện play/pause/ended (+ `beforeunload`/`pagehide` qua
 * `fetch(..., {keepalive:true})`, xem `HistoryWriter.tsx`).
 *
 * Phase 13D: ĐỌC History (`historiesQueryOptions.byFilm`) — chỉ khi đã đăng nhập + `playerType`
 * (tính theo `ep`/`server` trên URL, CHƯA tính History — gọi là "provisional") là `'hls'`. Đây là
 * giải pháp cho vòng phụ thuộc vốn có: muốn biết có nên đọc History không thì cần biết
 * `playerType`, nhưng `playerType` (khi URL không có `ep`) lại có thể phụ thuộc episode do History
 * chọn — nên `playbackState` được tính 2 lần ("provisional" dùng để quyết định có fetch History
 * hay không, rồi tính lại lần cuối có thêm `historyEpisodeSlug` nếu History đã có). `resolvePlaybackState`
 * đảm bảo `ep` trên URL luôn thắng History (xem `lib/watch/playback-state.ts`). Seek tới
 * `history.progressSeconds` (qua `HistoryResume`) CHỈ khi tập đang phát trùng `history.episodeSlug`
 * — seek theo tiến độ đo trên tập khác sẽ sai. KHÔNG ghi History mới, KHÔNG auto next, KHÔNG
 * Favorite/Mutation khác ở phase này.
 *
 * Phase 13A (tiếp): `EpisodeList(layout="list")` đã bỏ hẳn mock `_mock/watchmovie-data`'s
 * `episodes` — dùng `film.episodes[currentServerIndex].items` thật. `active`/`href` tính ở đây
 * (không phải trong `EpisodeList`): `active = slug === playbackState.currentEpisodeSlug`, `href`
 * dựng qua `buildWatchUrl()` (không hardcode string URL). Bấm 1 tập chỉ điều hướng URL (Next.js
 * `<Link>` trong `EpisodeList`) — KHÔNG `setState`, KHÔNG tự mutate `PlaybackState`; state luôn
 * resolve lại từ URL đúng kiến trúc đã chốt.
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
export function WatchMovieView({
  slug,
  episodeSlug,
  serverIndex,
}: {
  slug: string;
  episodeSlug?: string;
  serverIndex?: string;
}) {
  const { data: film } = useQuery(filmsQueryOptions.detail(slug));
  const { data: related } = useQuery(filmsQueryOptions.related(slug));
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
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

  // Pass 1 (provisional) — chưa tính History, chỉ dùng để quyết định có đủ điều kiện fetch
  // History hay không (yêu cầu 1: đã đăng nhập + playerType 'hls').
  const provisionalPlaybackState = film
    ? resolvePlaybackState(film, { ep: episodeSlug, server: serverIndex })
    : null;

  const { data: history } = useQuery({
    ...historiesQueryOptions.byFilm(film?._id ?? '', accessToken),
    enabled: Boolean(accessToken) && provisionalPlaybackState?.playerType === 'hls',
  });

  // Pass 2 (final) — nếu URL không có ep, History (nếu có) quyết định tập mặc định.
  const playbackState = film
    ? resolvePlaybackState(film, {
        ep: episodeSlug,
        server: serverIndex,
        historyEpisodeSlug: history?.episodeSlug,
      })
    : null;
  const resumeProgressSeconds =
    history && playbackState && history.episodeSlug === playbackState.currentEpisodeSlug
      ? history.progressSeconds
      : null;
  const currentServerItems = film?.episodes[playbackState?.currentServerIndex ?? 0]?.items ?? [];
  const watchEpisodes: ListEpisodeItem[] = currentServerItems.map((episode) => ({
    slug: episode.slug,
    name: episode.name,
    active: episode.slug === playbackState?.currentEpisodeSlug,
    href: buildWatchUrl(slug, episode.slug, playbackState?.currentServerIndex ?? 0),
  }));

  const rating = ratingAverage !== null ? ratingAverage.toFixed(1) : '—';
  const relatedMovies = related ?? [];

  return (
    <div className="flex flex-col">
      <Container maxWidth="max-w-[1920px]" className="py-md flex flex-col gap-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-9">
            <VideoPlayer
              currentTimeLabel={filmInfo.currentTimeLabel}
              playerType={playbackState?.playerType}
              currentVideoUrl={playbackState?.currentVideoUrl}
              onVideoRef={setVideoElement}
            />
            {playbackState?.playerType === 'hls' && film ? (
              <>
                <HistoryWriter
                  videoElement={videoElement}
                  filmId={film._id}
                  episodeSlug={playbackState.currentEpisodeSlug}
                  serverName={film.episodes[playbackState.currentServerIndex]?.serverName ?? ''}
                />
                <HistoryResume
                  videoElement={videoElement}
                  progressSeconds={resumeProgressSeconds}
                />
              </>
            ) : null}
          </div>
          <div className="hidden lg:block lg:col-span-3 lg:h-[716px] overflow-hidden">
            <EpisodeList episodes={watchEpisodes} layout="list" />
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
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Lưu lại"
                aria-pressed={isFavorited}
                onClick={toggleFavorite}
                disabled={isFavoritePending}
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ fontVariationSettings: `'FILL' ${isFavorited ? 1 : 0}` }}
                >
                  bookmark
                </span>
              </button>
              <span className="text-[10px] text-on-surface-variant">Lưu lại</span>
            </div>
          </div>
          <RatingInput myRating={myRating} onSelect={setRating} disabled={isRatingPending} />
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

          <EpisodeList episodes={watchEpisodes} layout="list" />
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
                  <div className="mt-sm">
                    <RatingInput
                      myRating={myRating}
                      onSelect={setRating}
                      disabled={isRatingPending}
                    />
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Thêm vào danh sách"
                    aria-pressed={isFavorited}
                    onClick={toggleFavorite}
                    disabled={isFavoritePending}
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      style={{ fontVariationSettings: `'FILL' ${isFavorited ? 1 : 0}` }}
                    >
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

            <CommentSection
              comments={comments}
              totalLabel={commentTotalLabel}
              onSubmit={sendComment}
              disabled={isCommentPending}
            />
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
