/**
 * Danh mục endpoint backend — đối chiếu trực tiếp từng controller ở backend/src (Phase 9.2
 * audit), khớp api_design.md. `API_PREFIX` khớp `apiPrefix` mặc định của backend
 * (backend/src/config/configuration.ts, .env.example: API_PREFIX=api/v1) — frontend không có
 * biến môi trường riêng cho prefix này (frontend.md §6 không liệt kê) nên hardcode theo đúng
 * giá trị mặc định đã xác nhận ở backend.
 *
 * Chỉ điền endpoint của 8 module được yêu cầu ở Phase 9.2 (auth, films, actors, categories,
 * comments, favorites, playlists, users). Các module khác (roles, permissions, film-reports,
 * avatars, crawler...) chưa có api module tương ứng, sẽ bổ sung khi được yêu cầu.
 */
export const API_PREFIX = '/api/v1';

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
} as const;

export const FILMS_ENDPOINTS = {
  list: '/films',
  top: '/films/top',
  hot: '/films/hot',
  latestSeries: '/films/latest-series',
  mostCommented: '/films/most-commented',
  bySlug: (slug: string) => `/films/${slug}`,
  related: (slug: string) => `/films/${slug}/related`,
  incrementView: (slug: string) => `/films/${slug}/view`,
  byId: (id: string) => `/films/${id}`,
} as const;

export const ACTORS_ENDPOINTS = {
  list: '/actors',
  bySlug: (slug: string) => `/actors/${slug}`,
  byId: (id: string) => `/actors/${id}`,
} as const;

export const CATEGORIES_ENDPOINTS = {
  list: '/categories',
  hot: '/categories/hot',
  bySlug: (slug: string) => `/categories/${slug}`,
  byId: (id: string) => `/categories/${id}`,
} as const;

export const COMMENTS_ENDPOINTS = {
  byFilm: (filmId: string) => `/comments/film/${filmId}`,
  replies: (id: string) => `/comments/${id}/replies`,
  topVoted: '/comments/top-voted',
  latest: '/comments/latest',
  moderationList: '/comments',
  create: '/comments',
  vote: (id: string) => `/comments/${id}/vote`,
  update: (id: string) => `/comments/${id}`,
  setVisibility: (id: string) => `/comments/${id}/visibility`,
  remove: (id: string) => `/comments/${id}`,
} as const;

export const FAVORITES_ENDPOINTS = {
  add: '/favorites',
  remove: (targetType: string, targetId: string) => `/favorites/${targetType}/${targetId}`,
  mine: '/favorites',
} as const;

export const PLAYLISTS_ENDPOINTS = {
  create: '/playlists',
  mine: '/playlists',
  byId: (id: string) => `/playlists/${id}`,
  addFilm: (id: string) => `/playlists/${id}/films`,
  removeFilm: (id: string, filmId: string) => `/playlists/${id}/films/${filmId}`,
} as const;

export const USERS_ENDPOINTS = {
  me: '/users/me',
  updateProfile: '/users/me',
  updatePassword: '/users/me/password',
} as const;

export const ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  films: FILMS_ENDPOINTS,
  actors: ACTORS_ENDPOINTS,
  categories: CATEGORIES_ENDPOINTS,
  comments: COMMENTS_ENDPOINTS,
  favorites: FAVORITES_ENDPOINTS,
  playlists: PLAYLISTS_ENDPOINTS,
  users: USERS_ENDPOINTS,
} as const;
