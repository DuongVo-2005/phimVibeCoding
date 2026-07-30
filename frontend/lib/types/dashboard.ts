/**
 * Phase 32 (v1.1 — Dashboard API): khớp `DashboardService` thật ở backend (`backend/src/
 * dashboard/dashboard.service.ts`) — các interface response TypeScript ở đó (không phải class
 * DTO có decorator, module này chỉ đọc/aggregate, không validate input phức tạp ngoài
 * `months`/`limit`).
 */
export interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  publishedMovies: number;
  draftMovies: number;
  categories: number;
  countries: number;
  actors: number;
  directors: number;
  comments: number;
  ratings: number;
  favorites: number;
  playlists: number;
  totalViews: number;
}

export interface DashboardMonthlyBucket {
  period: string;
  count: number;
}

export interface DashboardCharts {
  newUsers: DashboardMonthlyBucket[];
  moviesCreated: DashboardMonthlyBucket[];
  comments: DashboardMonthlyBucket[];
}

export interface DashboardFilmSummary {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  view: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface DashboardTopLists {
  mostViewedMovies: DashboardFilmSummary[];
  highestRatedMovies: DashboardFilmSummary[];
  mostFavoritedMovies: (DashboardFilmSummary & { favoriteCount: number })[];
}

export interface DashboardUserSummary {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DashboardCommentSummary {
  id: string;
  content: string;
  user: { id: string; name: string; email: string } | null;
  film: { id: string; slug: string; title: string } | null;
  createdAt: string;
}

export interface DashboardRecentActivity {
  newUsers: DashboardUserSummary[];
  latestMovies: DashboardFilmSummary[];
  latestComments: DashboardCommentSummary[];
}
