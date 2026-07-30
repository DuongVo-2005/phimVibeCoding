import { queryOptions } from '@tanstack/react-query';
import { actorsApi, type ActorsQueryParams } from '@/lib/api/actors';
import { avatarsApi } from '@/lib/api/avatars';
import { categoriesApi, type CategoriesQueryParams } from '@/lib/api/categories';
import {
  commentsApi,
  type CommentsByFilmQueryParams,
  type CommentsModerationQueryParams,
} from '@/lib/api/comments';
import { countriesApi } from '@/lib/api/countries';
import { dashboardApi, type DashboardChartsQueryParams } from '@/lib/api/dashboard';
import { directorsApi, type DirectorsQueryParams } from '@/lib/api/directors';
import { episodesApi } from '@/lib/api/episodes';
import { favoritesApi, type FavoritesQueryParams } from '@/lib/api/favorites';
import { filmsApi, type FilmsQueryParams, type FilmsTopQueryParams } from '@/lib/api/films';
import { historiesApi } from '@/lib/api/histories';
import { notificationsApi, type NotificationsQueryParams } from '@/lib/api/notifications';
import { playlistsApi } from '@/lib/api/playlists';
import { ratingsApi } from '@/lib/api/ratings';
import type { LimitQueryParams, PaginationQueryParams } from '@/lib/api/types';
import { permissionsApi } from '@/lib/api/permissions';
import { rolesApi } from '@/lib/api/roles';
import { usersApi, type UsersQueryParams } from '@/lib/api/users';
import {
  PRIVATE_QUERY_OPTIONS,
  PUBLIC_CONTENT_QUERY_OPTIONS,
  SOCIAL_QUERY_OPTIONS,
  STATIC_QUERY_OPTIONS,
} from './defaults';
import { queryKeys } from './keys';

/**
 * Phase 11.3A (kế hoạch triển khai, bước 4): `queryOptions()` (TanStack Query v5) cho các endpoint
 * ĐỌC — nối `lib/api/<domain>.ts` + `queryKeys` + nhóm cache mặc định ở `defaults.ts`. KHÔNG có
 * `useQuery`/`useMutation`/custom hook nào ở đây (đúng phạm vi 11.3A) — file này chỉ là factory,
 * chưa được `import` ở bất kỳ UI screen nào. Endpoint ghi (create/update/remove/vote/...) và
 * `authApi` (xử lý qua NextAuth `signIn`/`signOut`, không qua React Query) không thuộc phạm vi.
 */
export const filmsQueryOptions = {
  list: (params?: FilmsQueryParams, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.films.list(params),
      queryFn: () => filmsApi.list(params, accessToken),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  top: (params?: FilmsTopQueryParams) =>
    queryOptions({
      queryKey: queryKeys.films.top(params),
      queryFn: () => filmsApi.top(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  hot: (params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.films.hot(params),
      queryFn: () => filmsApi.hot(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  latestSeries: (params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.films.latestSeries(params),
      queryFn: () => filmsApi.latestSeries(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  mostCommented: (params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.films.mostCommented(params),
      queryFn: () => filmsApi.mostCommented(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.films.detail(slug),
      queryFn: () => filmsApi.bySlug(slug),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  related: (slug: string, params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.films.related(slug, params),
      queryFn: () => filmsApi.related(slug, params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),
};

export const actorsQueryOptions = {
  list: (params?: ActorsQueryParams) =>
    queryOptions({
      queryKey: queryKeys.actors.list(params),
      queryFn: () => actorsApi.list(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.actors.detail(slug),
      queryFn: () => actorsApi.bySlug(slug),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),
};

export const categoriesQueryOptions = {
  list: (params?: CategoriesQueryParams) =>
    queryOptions({
      queryKey: queryKeys.categories.list(params),
      queryFn: () => categoriesApi.list(params),
      ...STATIC_QUERY_OPTIONS,
    }),

  hot: () =>
    queryOptions({
      queryKey: queryKeys.categories.hot(),
      queryFn: () => categoriesApi.hot(),
      ...STATIC_QUERY_OPTIONS,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.categories.detail(slug),
      queryFn: () => categoriesApi.bySlug(slug),
      ...STATIC_QUERY_OPTIONS,
    }),
};

export const countriesQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.countries.list(),
      queryFn: () => countriesApi.list(),
      ...STATIC_QUERY_OPTIONS,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.countries.detail(slug),
      queryFn: () => countriesApi.bySlug(slug),
      ...STATIC_QUERY_OPTIONS,
    }),
};

/** Phase 19B.2: `directors` có phân trang + `search` (khác `categories`/`countries`) — dùng
 * `PUBLIC_CONTENT_QUERY_OPTIONS` (staleTime ngắn hơn `STATIC_QUERY_OPTIONS`) vì kết quả phụ thuộc
 * trực tiếp vào `search` do người dùng gõ, không phải danh sách gần-tĩnh như thể loại/quốc gia. */
export const directorsQueryOptions = {
  list: (params?: DirectorsQueryParams) =>
    queryOptions({
      queryKey: queryKeys.directors.list(params),
      queryFn: () => directorsApi.list(params),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.directors.detail(slug),
      queryFn: () => directorsApi.bySlug(slug),
      ...STATIC_QUERY_OPTIONS,
    }),
};

export const commentsQueryOptions = {
  byFilm: (filmId: string, params?: CommentsByFilmQueryParams) =>
    queryOptions({
      queryKey: queryKeys.comments.byFilm(filmId, params),
      queryFn: () => commentsApi.byFilm(filmId, params),
      ...SOCIAL_QUERY_OPTIONS,
    }),

  replies: (id: string, params?: PaginationQueryParams) =>
    queryOptions({
      queryKey: queryKeys.comments.replies(id, params),
      queryFn: () => commentsApi.replies(id, params),
      ...SOCIAL_QUERY_OPTIONS,
    }),

  topVoted: (params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.comments.topVoted(params),
      queryFn: () => commentsApi.topVoted(params),
      ...SOCIAL_QUERY_OPTIONS,
    }),

  latest: (params?: LimitQueryParams) =>
    queryOptions({
      queryKey: queryKeys.comments.latest(params),
      queryFn: () => commentsApi.latest(params),
      ...SOCIAL_QUERY_OPTIONS,
    }),

  /** Quản trị — yêu cầu access token, `enabled` phải tự guard `Boolean(accessToken)` ở nơi dùng. */
  moderation: (params: CommentsModerationQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.comments.moderation(params),
      queryFn: () => commentsApi.moderationList(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...SOCIAL_QUERY_OPTIONS,
    }),
};

export const ratingsQueryOptions = {
  summary: (filmId: string) =>
    queryOptions({
      queryKey: queryKeys.ratings.summary(filmId),
      queryFn: () => ratingsApi.summary(filmId),
      ...PUBLIC_CONTENT_QUERY_OPTIONS,
    }),

  /** Cá nhân hoá — yêu cầu access token. */
  mine: (filmId: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.ratings.mine(filmId),
      queryFn: () => ratingsApi.mine(filmId, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

export const favoritesQueryOptions = {
  /** Yêu cầu access token — toàn bộ module `favorites` không có route Public. */
  mine: (params: FavoritesQueryParams, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.favorites.mine(params),
      queryFn: () => favoritesApi.mine(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

export const historiesQueryOptions = {
  /** Yêu cầu access token — toàn bộ module `histories` không có route Public. */
  recent: (params: PaginationQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.histories.recent(params),
      queryFn: () => historiesApi.recent(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  byFilm: (filmId: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.histories.byFilm(filmId),
      queryFn: () => historiesApi.byFilm(filmId, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

export const playlistsQueryOptions = {
  /** Yêu cầu access token — toàn bộ module `playlists` không có route Public. */
  mine: (accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.playlists.mine(),
      queryFn: () => playlistsApi.mine(accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  detail: (id: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.playlists.detail(id),
      queryFn: () => playlistsApi.byId(id, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

export const usersQueryOptions = {
  /** Yêu cầu access token — `/users/me`. */
  me: (accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.users.me(),
      queryFn: () => usersApi.me(accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  /** Phase 19B.8: nhóm quản trị — yêu cầu access token admin. */
  list: (params: UsersQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.users.list(params),
      queryFn: () => usersApi.list(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  detail: (id: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.users.detail(id),
      queryFn: () => usersApi.byId(id, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

/** Phase 19B.9 (Admin Role/Permission Management): yêu cầu access token admin. */
export const rolesQueryOptions = {
  list: (accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.roles.list(),
      queryFn: () => rolesApi.list(accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  detail: (id: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.roles.detail(id),
      queryFn: () => rolesApi.byId(id, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  users: (id: string, params: PaginationQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.roles.users(id, params),
      queryFn: () => rolesApi.users(id, params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

export const permissionsQueryOptions = {
  list: (accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.permissions.list(),
      queryFn: () => permissionsApi.list(accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

/** Phase 19B.10 (Admin Avatar Management): `GET /avatars/types|images` là `@Public()` — không cần
 * accessToken để đọc (chỉ Create/Delete mới cần, xử lý ở `mutations.ts`). */
export const avatarsQueryOptions = {
  types: () =>
    queryOptions({
      queryKey: queryKeys.avatars.types(),
      queryFn: () => avatarsApi.types(),
      ...STATIC_QUERY_OPTIONS,
    }),

  images: (typeId?: string) =>
    queryOptions({
      queryKey: queryKeys.avatars.images(typeId),
      queryFn: () => avatarsApi.images(typeId),
      ...STATIC_QUERY_OPTIONS,
    }),
};

/** Phase 32 (v1.1 — Dashboard API): toàn bộ 4 route đều yêu cầu admin + `dashboard:view`, không
 * có route Public — cùng nhóm `PRIVATE_QUERY_OPTIONS` với `rolesQueryOptions`/`usersQueryOptions`
 * (yêu cầu access token admin). */
export const dashboardQueryOptions = {
  overview: (accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.dashboard.overview(),
      queryFn: () => dashboardApi.overview(accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  charts: (params: DashboardChartsQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.dashboard.charts(params),
      queryFn: () => dashboardApi.charts(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  topLists: (params: LimitQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.dashboard.topLists(params),
      queryFn: () => dashboardApi.topLists(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),

  recentActivity: (params: LimitQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.dashboard.recentActivity(params),
      queryFn: () => dashboardApi.recentActivity(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

/** Phase 34 (Notification Center) — không có route Public, cùng nhóm `PRIVATE_QUERY_OPTIONS`
 * (staleTime:0) như favorites/histories/playlists — dữ liệu cá nhân, refetch khi focus lại tab để
 * badge chuông không hiện số cũ. */
export const notificationsQueryOptions = {
  list: (params: NotificationsQueryParams | undefined, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.notifications.list(params),
      queryFn: () => notificationsApi.list(params, accessToken as string),
      enabled: Boolean(accessToken),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};

/** Phase 35 (Episode Management API) — admin-only, không có route Public. `staleTime:0`
 * (`PRIVATE_QUERY_OPTIONS`) — danh sách tập cần luôn khớp thao tác vừa thực hiện (thêm/sửa/xoá/sắp
 * xếp lại), không nên hiện dữ liệu cache cũ trong màn hình quản trị. */
export const episodesQueryOptions = {
  byFilm: (filmId: string, accessToken?: string) =>
    queryOptions({
      queryKey: queryKeys.episodes.byFilm(filmId),
      queryFn: () => episodesApi.listByFilm(filmId, accessToken as string),
      enabled: Boolean(accessToken) && Boolean(filmId),
      ...PRIVATE_QUERY_OPTIONS,
    }),
};
