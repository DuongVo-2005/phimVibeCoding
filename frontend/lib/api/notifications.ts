import type { Notification, NotificationListResponse } from '@/lib/types/notification';
import { request } from './client';
import { NOTIFICATIONS_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

export type NotificationsQueryParams = PaginationQueryParams & {
  isRead?: boolean;
};

/** Phase 34 (Notification Center) — toàn bộ route đều yêu cầu accessToken (không có route
 * Public), cùng nhóm với `favoritesApi`/`playlistsApi`. */
export const notificationsApi = {
  list(params: NotificationsQueryParams | undefined, accessToken: string) {
    return request<NotificationListResponse>(NOTIFICATIONS_ENDPOINTS.list, {
      query: params,
      accessToken,
    });
  },

  markRead(id: string, accessToken: string) {
    return request<Notification>(NOTIFICATIONS_ENDPOINTS.markRead(id), {
      method: 'PATCH',
      accessToken,
    });
  },

  markAllRead(accessToken: string) {
    return request<{ updated: number }>(NOTIFICATIONS_ENDPOINTS.markAllRead, {
      method: 'PATCH',
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(NOTIFICATIONS_ENDPOINTS.remove(id), {
      method: 'DELETE',
      accessToken,
    });
  },
};
