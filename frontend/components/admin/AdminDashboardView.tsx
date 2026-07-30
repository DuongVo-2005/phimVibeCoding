'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { dashboardQueryOptions } from '@/lib/query/options';
import type { DashboardOverview } from '@/lib/types/dashboard';
import { formatFilmDate } from '@/lib/utils/film-labels';
import { DashboardFilmRow } from './DashboardFilmRow';
import { DashboardMonthlyChart } from './DashboardMonthlyChart';

const TOP_LIST_LIMIT = 5;
const ACTIVITY_LIMIT = 5;

const OVERVIEW_STATS: { key: keyof DashboardOverview; label: string; icon: string }[] = [
  { key: 'totalUsers', label: 'Tổng người dùng', icon: 'group' },
  { key: 'activeUsers', label: 'Người dùng hoạt động', icon: 'how_to_reg' },
  { key: 'totalMovies', label: 'Tổng số phim', icon: 'movie' },
  { key: 'publishedMovies', label: 'Phim đã xuất bản', icon: 'check_circle' },
  { key: 'draftMovies', label: 'Phim ẩn/nháp', icon: 'drafts' },
  { key: 'categories', label: 'Thể loại', icon: 'category' },
  { key: 'countries', label: 'Quốc gia', icon: 'public' },
  { key: 'actors', label: 'Diễn viên', icon: 'theater_comedy' },
  { key: 'directors', label: 'Đạo diễn', icon: 'video_camera_front' },
  { key: 'comments', label: 'Bình luận', icon: 'forum' },
  { key: 'ratings', label: 'Đánh giá', icon: 'star' },
  { key: 'favorites', label: 'Yêu thích', icon: 'favorite' },
  { key: 'playlists', label: 'Playlist', icon: 'playlist_play' },
  { key: 'totalViews', label: 'Tổng lượt xem', icon: 'visibility' },
];

/** Panel wrapper dùng chung cho các nhóm "Top" / "Hoạt động gần đây" — cùng khung
 * `rounded-2xl bg-surface-container p-lg` như mọi section admin khác trong dự án. */
function DashboardPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-sm rounded-2xl bg-surface-container p-lg">
      <h3 className="text-label-lg font-label-lg text-on-surface">{title}</h3>
      {children}
    </div>
  );
}

/**
 * AdminDashboardView — Phase 32 (v1.1 — Dashboard API). Thay `EmptyState` giả (chưa có API) bằng
 * dashboard thật, gọi 4 endpoint `GET /dashboard/{overview,charts,top-lists,recent-activity}`
 * (`dashboard.controller.ts`, yêu cầu admin + `dashboard:view` — cùng cơ chế `RoleGuard` +
 * `PermissionsGuard` mọi trang admin khác đã dùng). Mỗi nhóm (overview/charts/top-lists/recent-
 * activity) là 1 `useQuery` ĐỘC LẬP với skeleton/error/empty riêng — 1 API lỗi không kéo sập cả
 * trang (cùng nguyên tắc "mỗi section tự quản lý trạng thái" đã áp dụng cho
 * ContinueWatchingSection/TopRatedSection ở trang chủ).
 */
export function AdminDashboardView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const overviewQuery = useQuery(dashboardQueryOptions.overview(accessToken));
  const chartsQuery = useQuery(dashboardQueryOptions.charts(undefined, accessToken));
  const topListsQuery = useQuery(
    dashboardQueryOptions.topLists({ limit: TOP_LIST_LIMIT }, accessToken),
  );
  const recentActivityQuery = useQuery(
    dashboardQueryOptions.recentActivity({ limit: ACTIVITY_LIMIT }, accessToken),
  );

  return (
    <div className="flex flex-col gap-lg">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Dashboard</h1>

      {/* Overview */}
      {overviewQuery.isError ? (
        <ErrorState
          message="Không tải được số liệu tổng quan."
          onRetry={() => overviewQuery.refetch()}
        />
      ) : overviewQuery.isLoading || !overviewQuery.data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-md" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-md">
          {OVERVIEW_STATS.map((stat) => (
            <div
              key={stat.key}
              className="flex items-center gap-sm rounded-2xl bg-surface-container p-lg"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {stat.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-headline-md font-headline-md text-on-surface truncate">
                  {overviewQuery.data[stat.key].toLocaleString('vi-VN')}
                </p>
                <p className="text-label-md text-on-surface-variant leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <section className="flex flex-col gap-sm">
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Thống kê theo tháng (12 tháng gần nhất)
        </h2>
        {chartsQuery.isError ? (
          <ErrorState message="Không tải được biểu đồ." onRetry={() => chartsQuery.refetch()} />
        ) : chartsQuery.isLoading || !chartsQuery.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            <DashboardMonthlyChart title="Người dùng mới" data={chartsQuery.data.newUsers} />
            <DashboardMonthlyChart title="Phim mới tạo" data={chartsQuery.data.moviesCreated} />
            <DashboardMonthlyChart title="Bình luận mới" data={chartsQuery.data.comments} />
          </div>
        )}
      </section>

      {/* Top Lists */}
      <section className="flex flex-col gap-sm">
        <h2 className="text-headline-md font-headline-md text-on-surface">Top phim</h2>
        {topListsQuery.isError ? (
          <ErrorState message="Không tải được top phim." onRetry={() => topListsQuery.refetch()} />
        ) : topListsQuery.isLoading || !topListsQuery.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            <DashboardPanel title="Xem nhiều nhất">
              {topListsQuery.data.mostViewedMovies.length === 0 ? (
                <EmptyState icon="visibility" message="Chưa có dữ liệu." />
              ) : (
                <div className="flex flex-col gap-1">
                  {topListsQuery.data.mostViewedMovies.map((film) => (
                    <DashboardFilmRow
                      key={film.id}
                      film={film}
                      metricIcon="visibility"
                      metricValue={film.view.toLocaleString('vi-VN')}
                    />
                  ))}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Đánh giá cao nhất">
              {topListsQuery.data.highestRatedMovies.length === 0 ? (
                <EmptyState icon="star" message="Chưa có dữ liệu." />
              ) : (
                <div className="flex flex-col gap-1">
                  {topListsQuery.data.highestRatedMovies.map((film) => (
                    <DashboardFilmRow
                      key={film.id}
                      film={film}
                      metricIcon="star"
                      metricValue={
                        film.ratingCount > 0
                          ? `${film.ratingAvg.toFixed(1)} (${film.ratingCount.toLocaleString('vi-VN')})`
                          : '—'
                      }
                    />
                  ))}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Yêu thích nhiều nhất">
              {topListsQuery.data.mostFavoritedMovies.length === 0 ? (
                <EmptyState icon="favorite" message="Chưa có dữ liệu." />
              ) : (
                <div className="flex flex-col gap-1">
                  {topListsQuery.data.mostFavoritedMovies.map((film) => (
                    <DashboardFilmRow
                      key={film.id}
                      film={film}
                      metricIcon="favorite"
                      metricValue={film.favoriteCount.toLocaleString('vi-VN')}
                    />
                  ))}
                </div>
              )}
            </DashboardPanel>
          </div>
        )}
      </section>

      {/* Latest Activity */}
      <section className="flex flex-col gap-sm">
        <h2 className="text-headline-md font-headline-md text-on-surface">Hoạt động gần đây</h2>
        {recentActivityQuery.isError ? (
          <ErrorState
            message="Không tải được hoạt động gần đây."
            onRetry={() => recentActivityQuery.refetch()}
          />
        ) : recentActivityQuery.isLoading || !recentActivityQuery.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            <DashboardPanel title="Người dùng mới">
              {recentActivityQuery.data.newUsers.length === 0 ? (
                <EmptyState icon="group" message="Chưa có người dùng mới." />
              ) : (
                <div className="flex flex-col gap-sm">
                  {recentActivityQuery.data.newUsers.map((user) => (
                    <div key={user.id} className="flex flex-col">
                      <p className="text-label-md font-bold text-on-surface truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-label-md text-on-surface-variant truncate">
                        {user.email} • {formatFilmDate(user.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Phim mới nhất">
              {recentActivityQuery.data.latestMovies.length === 0 ? (
                <EmptyState icon="movie" message="Chưa có phim." />
              ) : (
                <div className="flex flex-col gap-1">
                  {recentActivityQuery.data.latestMovies.map((film) => (
                    <DashboardFilmRow
                      key={film.id}
                      film={film}
                      metricIcon="visibility"
                      metricValue={film.view.toLocaleString('vi-VN')}
                    />
                  ))}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Bình luận mới nhất">
              {recentActivityQuery.data.latestComments.length === 0 ? (
                <EmptyState icon="forum" message="Chưa có bình luận." />
              ) : (
                <div className="flex flex-col gap-sm">
                  {recentActivityQuery.data.latestComments.map((comment) => (
                    <div key={comment.id} className="flex flex-col gap-0.5">
                      <p className="text-label-md text-on-surface line-clamp-2">
                        {comment.content}
                      </p>
                      <p className="text-label-md text-on-surface-variant truncate">
                        {comment.user?.name || comment.user?.email || 'Ẩn danh'}
                        {comment.film ? (
                          <>
                            {' • '}
                            <Link
                              href={`/admin/phim/${comment.film.slug}`}
                              className="hover:underline"
                            >
                              {comment.film.title}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </div>
        )}
      </section>
    </div>
  );
}
