import type { ActorsQueryParams } from '@/lib/api/actors';
import type { CategoriesQueryParams } from '@/lib/api/categories';
import type { CommentsByFilmQueryParams, CommentsModerationQueryParams } from '@/lib/api/comments';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import type { FilmsQueryParams, FilmsTopQueryParams } from '@/lib/api/films';
import type { LimitQueryParams, PaginationQueryParams } from '@/lib/api/types';

/**
 * Phase 11.3A (quyết định 4): factory query key tập trung theo domain — KHÔNG hardcode mảng ở
 * nơi gọi. Theo cấu trúc phân cấp `all()` → `lists()`/`details()` → `list(params)`/`detail(id)`
 * khuyến nghị của TanStack Query — cho phép invalidate rộng (`films.all()`) hoặc hẹp
 * (`films.detail(slug)`) tuỳ nhu cầu ở phase viết hook thật (Phase 11.4+). CHƯA có `useQuery` nào
 * import file này.
 */
export const queryKeys = {
  films: {
    all: () => ['films'] as const,
    lists: () => [...queryKeys.films.all(), 'list'] as const,
    list: (params?: FilmsQueryParams) => [...queryKeys.films.lists(), params] as const,
    top: (params?: FilmsTopQueryParams) => [...queryKeys.films.all(), 'top', params] as const,
    hot: (params?: LimitQueryParams) => [...queryKeys.films.all(), 'hot', params] as const,
    latestSeries: (params?: LimitQueryParams) =>
      [...queryKeys.films.all(), 'latest-series', params] as const,
    mostCommented: (params?: LimitQueryParams) =>
      [...queryKeys.films.all(), 'most-commented', params] as const,
    details: () => [...queryKeys.films.all(), 'detail'] as const,
    detail: (slug: string) => [...queryKeys.films.details(), slug] as const,
    related: (slug: string, params?: LimitQueryParams) =>
      [...queryKeys.films.all(), 'related', slug, params] as const,
  },

  actors: {
    all: () => ['actors'] as const,
    lists: () => [...queryKeys.actors.all(), 'list'] as const,
    list: (params?: ActorsQueryParams) => [...queryKeys.actors.lists(), params] as const,
    details: () => [...queryKeys.actors.all(), 'detail'] as const,
    detail: (slug: string) => [...queryKeys.actors.details(), slug] as const,
  },

  categories: {
    all: () => ['categories'] as const,
    lists: () => [...queryKeys.categories.all(), 'list'] as const,
    list: (params?: CategoriesQueryParams) => [...queryKeys.categories.lists(), params] as const,
    hot: () => [...queryKeys.categories.all(), 'hot'] as const,
    details: () => [...queryKeys.categories.all(), 'detail'] as const,
    detail: (slug: string) => [...queryKeys.categories.details(), slug] as const,
  },

  countries: {
    all: () => ['countries'] as const,
    list: () => [...queryKeys.countries.all(), 'list'] as const,
    details: () => [...queryKeys.countries.all(), 'detail'] as const,
    detail: (slug: string) => [...queryKeys.countries.details(), slug] as const,
  },

  comments: {
    all: () => ['comments'] as const,
    byFilm: (filmId: string, params?: CommentsByFilmQueryParams) =>
      [...queryKeys.comments.all(), 'byFilm', filmId, params] as const,
    replies: (id: string, params?: PaginationQueryParams) =>
      [...queryKeys.comments.all(), 'replies', id, params] as const,
    topVoted: (params?: LimitQueryParams) =>
      [...queryKeys.comments.all(), 'top-voted', params] as const,
    latest: (params?: LimitQueryParams) => [...queryKeys.comments.all(), 'latest', params] as const,
    moderation: (params?: CommentsModerationQueryParams) =>
      [...queryKeys.comments.all(), 'moderation', params] as const,
  },

  ratings: {
    all: () => ['ratings'] as const,
    summary: (filmId: string) => [...queryKeys.ratings.all(), 'summary', filmId] as const,
    mine: (filmId: string) => [...queryKeys.ratings.all(), 'mine', filmId] as const,
  },

  favorites: {
    all: () => ['favorites'] as const,
    mine: (params: FavoritesQueryParams) => [...queryKeys.favorites.all(), 'mine', params] as const,
  },

  histories: {
    all: () => ['histories'] as const,
    recent: (params?: PaginationQueryParams) =>
      [...queryKeys.histories.all(), 'recent', params] as const,
    byFilm: (filmId: string) => [...queryKeys.histories.all(), 'byFilm', filmId] as const,
  },

  playlists: {
    all: () => ['playlists'] as const,
    mine: () => [...queryKeys.playlists.all(), 'mine'] as const,
    details: () => [...queryKeys.playlists.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.playlists.details(), id] as const,
  },

  users: {
    all: () => ['users'] as const,
    me: () => [...queryKeys.users.all(), 'me'] as const,
  },
} as const;
