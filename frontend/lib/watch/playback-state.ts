import type { EpisodeItem, FilmDetail } from '@/lib/types/film';

export type PlayerType = 'hls' | 'iframe' | 'none';

export interface PlaybackState {
  currentServerIndex: number;
  currentEpisodeSlug: string;
  currentEpisode: EpisodeItem | null;
  nextEpisode: EpisodeItem | null;
  previousEpisode: EpisodeItem | null;
  playerType: PlayerType;
  currentVideoUrl: string;
}

/**
 * Phase 13A: derive TOÀN BỘ trạng thái phát từ `FilmDetail.episodes` (đã fetch sẵn qua
 * `filmsQueryOptions.detail`) + query param thô từ URL — KHÔNG có React state riêng, gọi lại hàm
 * này mỗi lần render là đủ (film/searchParams đổi → kết quả tự đổi theo, không có state trùng lặp
 * cần đồng bộ tay).
 *
 * Không redirect, không throw — `server`/`ep` sai hoặc thiếu đều rơi về fallback im lặng:
 * `server` không hợp lệ (không phải số nguyên trong khoảng hợp lệ) → server đầu tiên (index 0).
 * `ep` không tồn tại trong server hiện tại → tập đầu tiên của server đó.
 *
 * Phase 13D: thêm `historyEpisodeSlug` (tuỳ chọn, KHÔNG phải query param URL — do `WatchMovieView`
 * tự truyền vào từ `History` đã fetch). Thứ tự ưu tiên chọn tập: `ep` trên URL LUÔN thắng (không
 * bao giờ bị History ghi đè); nếu URL không có `ep`, `historyEpisodeSlug` (nếu có và tồn tại trong
 * server hiện tại) quyết định tập mặc định; nếu cả 2 đều không có/không khớp, giữ nguyên hành vi
 * cũ (tập đầu tiên, index 0). Không tự suy ra `server` từ History — chỉ áp dụng cho việc chọn tập,
 * đúng phạm vi yêu cầu.
 */
export function resolvePlaybackState(
  film: Pick<FilmDetail, 'episodes'>,
  searchParams: { ep?: string; server?: string; historyEpisodeSlug?: string },
): PlaybackState {
  const servers = film.episodes;

  const parsedServerIndex = searchParams.server !== undefined ? Number(searchParams.server) : NaN;
  const currentServerIndex =
    Number.isInteger(parsedServerIndex) &&
    parsedServerIndex >= 0 &&
    parsedServerIndex < servers.length
      ? parsedServerIndex
      : 0;

  const items = servers[currentServerIndex]?.items ?? [];

  let currentIndex = searchParams.ep
    ? items.findIndex((item) => item.slug === searchParams.ep)
    : -1;

  if (currentIndex === -1 && !searchParams.ep && searchParams.historyEpisodeSlug) {
    currentIndex = items.findIndex((item) => item.slug === searchParams.historyEpisodeSlug);
  }

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const currentEpisode = items[currentIndex] ?? null;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
  const previousEpisode = currentIndex > 0 ? items[currentIndex - 1] : null;

  let playerType: PlayerType = 'none';
  let currentVideoUrl = '';
  if (currentEpisode?.m3u8Url) {
    playerType = 'hls';
    currentVideoUrl = currentEpisode.m3u8Url;
  } else if (currentEpisode?.embedUrl) {
    playerType = 'iframe';
    currentVideoUrl = currentEpisode.embedUrl;
  }

  return {
    currentServerIndex,
    currentEpisodeSlug: currentEpisode?.slug ?? '',
    currentEpisode,
    nextEpisode,
    previousEpisode,
    playerType,
    currentVideoUrl,
  };
}
