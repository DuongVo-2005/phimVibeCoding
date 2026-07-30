/**
 * Khớp `episodes/schemas/episode.schema.ts` thật (Phase 35) — collection ĐỘC LẬP hoàn toàn với
 * `Film.episodes` (embedded, dùng bởi crawler + trang xem phim công khai). Đây là kiến trúc TẠM
 * THỜI có chủ đích theo ADR đã duyệt: admin quản lý tập phim qua collection này, phát trực tuyến
 * công khai vẫn đọc `Film.episodes` như cũ — xem RELEASE_NOTES.md và báo cáo Phase 35.
 */
export interface Episode {
  _id: string;
  filmId: string;
  episodeNumber: number;
  title: string;
  embedUrl: string;
  m3u8Url: string;
  subtitleUrl: string;
  duration: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpisodeInput {
  episodeNumber: number;
  title: string;
  embedUrl?: string;
  m3u8Url?: string;
  subtitleUrl?: string;
  duration?: string;
  isPublished?: boolean;
}

/** `displayOrder` KHÔNG có ở đây — chỉ đổi được qua `episodesApi.updateOrder()` riêng (khớp
 * backend: `UpdateEpisodeDto` kế thừa `CreateEpisodeDto`, không có `displayOrder`). */
export type UpdateEpisodeInput = Partial<CreateEpisodeInput>;
