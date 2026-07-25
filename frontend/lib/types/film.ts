import type { ActorRef } from './actor';
import type { CategoryRef } from './category';
import type { CountryRef } from './country';
import type { DirectorRef } from './director';

/**
 * Khớp `films/schemas/film.schema.ts` thật (Phase 11.0 audit). Quyết định 2 (Phase 11.2):
 * `FilmRef`, `FilmSummary`, `FilmDetail` giữ TÁCH BIỆT hoàn toàn — không gộp.
 *
 * - `FilmSummary`: shape đầy đủ dùng cho `/films` (list), `/films/top`, `/hot`, `/latest-series`,
 *   `/most-commented`, `/:slug/related`, và `target` của `Favorite` khi `targetType=film`.
 * - `FilmDetail extends FilmSummary`: thêm field chỉ có ở `GET /films/:slug` (mô tả, trailer,
 *   ngôn ngữ, diễn viên, danh sách tập).
 * - `FilmRef`: shape RÚT GỌN thật sự khác — chỉ dùng khi backend populate `film` với tập con field
 *   đã xác nhận (`History.film`, `Playlist.films`: `title,slug,posterUrl,thumbUrl,category,
 *   episodeCurrent,isPublished`). Dùng `FilmSummary` ở 2 chỗ này sẽ khai sai (field không tồn tại
 *   lúc runtime nhưng type nói có) — đây là lý do KHÔNG được gộp `FilmRef` vào `FilmSummary`.
 */
export interface EpisodeItem {
  name: string;
  slug: string;
  embedUrl?: string;
  m3u8Url?: string;
}

export interface EpisodeServer {
  serverName: string;
  items: EpisodeItem[];
}

export interface FilmSummary {
  _id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  thumbUrl?: string;
  category: 'single' | 'series';
  quality?: string;
  duration?: string;
  episodeCurrent?: string;
  episodeTotal?: string;
  releaseYear?: number;
  view: number;
  ratingAvg: number;
  ratingCount: number;
  commentCount: number;
  isHot: boolean;
  isPublished: boolean;
  status: 'ongoing' | 'completed';
  categories: CategoryRef[];
  countries: CountryRef[];
  directors: DirectorRef[];
  createdAt: string;
  updatedAt: string;
}

export interface FilmDetail extends FilmSummary {
  description?: string;
  trailerUrl?: string;
  language?: string;
  actors: ActorRef[];
  episodes: EpisodeServer[];
  sourceSlug?: string | null;
  sourceUpdatedAt?: string | null;
}

/** Film populate rút gọn — xem ghi chú tách biệt ở đầu file. KHÔNG kế thừa từ FilmSummary. */
export interface FilmRef {
  _id: string;
  slug: string;
  title: string;
  posterUrl?: string;
  thumbUrl?: string;
  category: 'single' | 'series';
  episodeCurrent?: string;
  isPublished: boolean;
}

export interface CreateFilmInput {
  title: string;
  originalTitle?: string;
  description?: string;
  posterUrl?: string;
  thumbUrl?: string;
  trailerUrl?: string;
  episodeCurrent?: string;
  episodeTotal?: string;
  duration?: string;
  quality?: string;
  language?: string;
  category?: 'single' | 'series';
  releaseYear?: number;
  countries?: string[];
  directors?: string[];
  actors?: string[];
  categories?: string[];
  episodes?: EpisodeServer[];
  status?: 'ongoing' | 'completed';
  isPublished?: boolean;
}

/** Khớp `UpdateFilmDto = PartialType(OmitType(CreateFilmDto,['episodes']))` thật — không sửa episodes qua route này. */
export type UpdateFilmInput = Partial<Omit<CreateFilmInput, 'episodes'>>;
