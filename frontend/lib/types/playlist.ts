import type { FilmRef } from './film';

/**
 * Khớp `playlists/schemas/playlist.schema.ts` thật (Phase 11.0 audit) — `user,name,films[]`.
 *
 * Quyết định 3 (Phase 11.2): `GET /playlists` (list) CHƯA xác nhận có populate `films` hay chỉ
 * trả ObjectId thô — agent Phase 11.0 chỉ xác nhận populate cho `GET /playlists/:id` (chi tiết:
 * `title,slug,posterUrl,thumbUrl,category,episodeCurrent`). KHÔNG suy đoán — `PlaylistSummary`
 * (dùng cho list/create/update) CỐ TÌNH không có field `films` nào cả (kể cả dạng `string[]`) cho
 * tới khi verify được backend thật. `PlaylistDetail` (dùng cho `GET /playlists/:id` — đã xác
 * nhận) mới có `films: FilmRef[]`.
 */
export interface PlaylistSummary {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDetail {
  _id: string;
  name: string;
  films: FilmRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaylistInput {
  name: string;
}

export type UpdatePlaylistInput = CreatePlaylistInput;

export interface AddFilmToPlaylistInput {
  filmId: string;
}
