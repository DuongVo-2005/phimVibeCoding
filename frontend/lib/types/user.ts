/**
 * Khớp `users/schemas/user.schema.ts` thật (Phase 11.0 audit) — `email,name,gender,avatar,role,
 * roleIds,isActive` (`password`/`resetPasswordToken(Expires)`/`refreshTokenHash` luôn
 * `select:false`, không bao giờ xuất hiện trong response).
 *
 * `UserProfile` (resource REST `/users/me`) TÁCH RIÊNG khỏi `AuthUser`/`AuthTokens`
 * (`lib/api/types.ts`) có chủ đích — 2 khái niệm khác nhau dù trùng vài field:
 * - `AuthUser`/`AuthTokens`: object NextAuth tự dựng thủ công trong `AuthService` cho response
 *   login/register/refresh (`{id,email,name,role}` — dùng `id` không phải `_id`, đã xác nhận
 *   đúng ở Phase 11.0, KHÔNG sửa).
 * - `UserProfile`: document Mongoose thật trả về từ `GET/PATCH /users/me` (dùng `_id`).
 * Gộp 2 type này sẽ sai field `id`/`_id` ở 1 trong 2 nơi.
 */
export type UserGender = 'male' | 'female' | 'other';
export type AppUserRole = 'user' | 'admin';

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  gender: UserGender;
  avatar?: string;
  role: AppUserRole;
  roleIds: string[];
  isActive: boolean;
  /** Phase 33 (Verify Email) — khớp `user.schema.ts` thật (`isEmailVerified`/`emailVerifiedAt`). */
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  gender?: UserGender;
  avatar?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Phase 19B.8 (Admin User Management): khớp `CreateUserByAdminDto` thật — `roleIds` bỏ trống
 * (mặc định role "user") vì việc chọn RBAC role cụ thể thuộc phạm vi phase Role/Permission Management
 * riêng; sau khi tạo, admin vẫn đổi được `role` (user/admin) qua `UpdateUserRoleInput`. */
export interface CreateUserByAdminInput {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserRoleInput {
  role: AppUserRole;
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}
