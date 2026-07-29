/** Khớp `roles/schemas/role.schema.ts` thật (Phase 19B.9). `isSystem` (role "admin"/"user" seed
 * sẵn) không cho đổi tên/xoá — backend tự chặn (`ConflictException`), UI cũng tự vô hiệu hoá
 * trước (defense-in-depth, cùng nguyên tắc `ensureNotSelf` ở User Management). */
export interface Role {
  _id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `GET /roles/:id` — thêm `permissionKeys` (đã resolve, không phải chỉ ID) so với `Role`. */
export interface RoleDetail extends Role {
  permissionKeys: string[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export type UpdateRoleInput = Partial<CreateRoleInput>;
