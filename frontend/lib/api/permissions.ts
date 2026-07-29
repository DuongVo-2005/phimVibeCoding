import type { Permission } from '@/lib/types/permission';
import { request } from './client';
import { PERMISSIONS_ENDPOINTS } from './endpoints';

/** Chỉ `list` — xem ghi chú `endpoints.ts`. */
export const permissionsApi = {
  list(accessToken: string) {
    return request<Permission[]>(PERMISSIONS_ENDPOINTS.list, { accessToken });
  },
};
