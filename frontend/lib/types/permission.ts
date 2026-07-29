/**
 * Khớp `permissions/schemas/permission.schema.ts` thật (Phase 19B.9). `key` dạng "resource:action"
 * (vd "films:create") — khoá tự nhiên, bất biến. CHỈ đọc (`findAll()`) — không có
 * Create/Update/Delete UI, xem ghi chú `AdminRoleListView.tsx`.
 */
export interface Permission {
  _id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
