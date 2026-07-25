import type { FilmRef } from './film';

/**
 * Khớp `histories/schemas/history.schema.ts` thật (Phase 11.0 audit) — `user,film,episodeSlug,
 * serverName,progressSeconds,totalDurationSeconds,lastWatchedAt`. `progressPercent` KHÔNG phải
 * field thật — phải tự tính `progressSeconds/totalDurationSeconds*100` ở nơi gọi, không thêm vào
 * type này để tránh ngộ nhận là field server trả về.
 *
 * `film` dùng `FilmRef` (không phải `FilmSummary`) — `GET /histories/recent` chỉ populate
 * `title,slug,posterUrl,thumbUrl,episodeCurrent,category,isPublished` (đã xác nhận Phase 11.0).
 */
export interface History {
  _id: string;
  film: FilmRef;
  episodeSlug?: string;
  serverName?: string;
  progressSeconds: number;
  totalDurationSeconds: number;
  lastWatchedAt: string;
}

export interface UpdateHistoryInput {
  film: string;
  episodeSlug?: string;
  serverName?: string;
  progressSeconds?: number;
  totalDurationSeconds?: number;
}
