import type {
  DashboardCharts,
  DashboardOverview,
  DashboardRecentActivity,
  DashboardTopLists,
} from '@/lib/types/dashboard';
import { request } from './client';
import { DASHBOARD_ENDPOINTS } from './endpoints';
import type { LimitQueryParams } from './types';

export type DashboardChartsQueryParams = {
  months?: number;
};

/** Phase 32 (v1.1 — Dashboard API): khớp `dashboard.controller.ts` — toàn bộ 4 route đều yêu cầu
 * `accessToken` (admin + `dashboard:view`), không có route Public nào. */
export const dashboardApi = {
  overview(accessToken: string) {
    return request<DashboardOverview>(DASHBOARD_ENDPOINTS.overview, { accessToken });
  },

  charts(params: DashboardChartsQueryParams | undefined, accessToken: string) {
    return request<DashboardCharts>(DASHBOARD_ENDPOINTS.charts, { query: params, accessToken });
  },

  topLists(params: LimitQueryParams | undefined, accessToken: string) {
    return request<DashboardTopLists>(DASHBOARD_ENDPOINTS.topLists, { query: params, accessToken });
  },

  recentActivity(params: LimitQueryParams | undefined, accessToken: string) {
    return request<DashboardRecentActivity>(DASHBOARD_ENDPOINTS.recentActivity, {
      query: params,
      accessToken,
    });
  },
};
