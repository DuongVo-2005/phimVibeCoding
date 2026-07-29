/**
 * Danh mục endpoint backend — đối chiếu trực tiếp từng controller ở backend/src (Phase 9.2 audit,
 * bổ sung Phase 11.2 — histories/ratings/countries — theo audit mã nguồn thật Phase 11.0).
 * `API_PREFIX` khớp `apiPrefix` mặc định của backend (backend/src/config/configuration.ts,
 * .env.example: API_PREFIX=api/v1) — frontend không có biến môi trường riêng cho prefix này
 * (frontend.md §6 không liệt kê) nên hardcode theo đúng giá trị mặc định đã xác nhận ở backend.
 *
 * 11 module đã có client (auth, films, actors, categories, comments, favorites, playlists, users,
 * histories, ratings, countries). Các module còn lại (roles, permissions, film-reports, avatars,
 * directors, crawler, dashboard...) chưa có api module tương ứng — ngoài phạm vi 7 màn hình public
 * hiện tại, sẽ bổ sung khi được yêu cầu.
 */
export const API_PREFIX = '/api/v1';

export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
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
  // Phase 19B.8 (Admin User Management): nhóm route quản trị — trước đây bỏ ngoài phạm vi
  // 11.2 (chỉ 7 màn hình public), khớp `users.controller.ts` thật.
  list: '/users',
  byId: (id: string) => `/users/${id}`,
  updateRole: (id: string) => `/users/${id}/role`,
  updateStatus: (id: string) => `/users/${id}/status`,
} as const;

export const HISTORIES_ENDPOINTS = {
  update: '/histories',
  recent: '/histories/recent',
  byFilm: (filmId: string) => `/histories/film/${filmId}`,
  remove: (filmId: string) => `/histories/${filmId}`,
} as const;

export const RATINGS_ENDPOINTS = {
  summary: (filmId: string) => `/ratings/film/${filmId}`,
  mine: (filmId: string) => `/ratings/film/${filmId}/me`,
  byFilm: (filmId: string) => `/ratings/${filmId}`,
} as const;

export const COUNTRIES_ENDPOINTS = {
  list: '/countries',
  bySlug: (slug: string) => `/countries/${slug}`,
  byId: (id: string) => `/countries/${id}`,
} as const;

/** Phase 19B.2 (Admin Movie Create/Edit): trước đây `directors` chưa có client (audit Phase 11.2,
 * nhóm C — chưa có UI dùng). Khớp `directors.controller.ts` thật. */
export const DIRECTORS_ENDPOINTS = {
  list: '/directors',
  bySlug: (slug: string) => `/directors/${slug}`,
  byId: (id: string) => `/directors/${id}`,
} as const;

/** Phase 19B.9 (Admin Role/Permission Management): khớp `roles.controller.ts` thật. */
export const ROLES_ENDPOINTS = {
  list: '/roles',
  byId: (id: string) => `/roles/${id}`,
  permissions: (id: string) => `/roles/${id}/permissions`,
  users: (id: string) => `/roles/${id}/users`,
} as const;

/** Khớp `permissions.controller.ts` thật — CHỈ dùng `list` (đọc, làm nguồn checklist khi gán
 * quyền cho role); Create/Update/Delete permission KHÔNG có UI (xem ghi chú `AdminRoleListView`). */
export const PERMISSIONS_ENDPOINTS = {
  list: '/permissions',
} as const;

/** Phase 19B.10 (Admin Avatar Management): khớp `avatars.controller.ts` thật. */
export const AVATARS_ENDPOINTS = {
  types: '/avatars/types',
  typeById: (id: string) => `/avatars/types/${id}`,
  images: '/avatars/images',
  imageById: (id: string) => `/avatars/images/${id}`,
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
  histories: HISTORIES_ENDPOINTS,
  ratings: RATINGS_ENDPOINTS,
  countries: COUNTRIES_ENDPOINTS,
  directors: DIRECTORS_ENDPOINTS,
  roles: ROLES_ENDPOINTS,
  permissions: PERMISSIONS_ENDPOINTS,
  avatars: AVATARS_ENDPOINTS,
} as const;
