import type { ActorSummary } from './actor';
import type { FilmSummary } from './film';

/**
 * Khớp `favorites/schemas/favorite.schema.ts` + response thật đã resolve của
 * `favorites.controller.ts` (Phase 11.0 audit) — response KHÔNG phải schema thô
 * `{user,targetType,target:ObjectId}`, mà là `ResolvedFavorite = {_id,targetType,
 * target:FilmDocument|ActorDocument|null,createdAt}` (service tự resolve `target` theo
 * `targetType`, không có `refPath`).
 */
export type FavoriteTargetType = 'film' | 'actor';

export interface Favorite {
  _id: string;
  targetType: FavoriteTargetType;
  target: FilmSummary | ActorSummary | null;
  createdAt: string;
}

export interface CreateFavoriteInput {
  targetType: FavoriteTargetType;
  target: string;
}
