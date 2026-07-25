/**
 * Phase 11.2: envelope chung (`ApiResponse`/`PaginatedResponse`/`ErrorResponse`) đã dời sang
 * `lib/types/common.ts` (đúng cấu trúc domain-first) — file này chỉ còn giữ:
 * - Type request-shape thuần tuý (`PaginationQueryParams`/`LimitQueryParams`) — không phải domain
 *   entity, không thuộc về `lib/types/*`.
 * - `AuthUser`/`AuthTokens` — object NextAuth/AuthService tự dựng thủ công cho response
 *   login/register/refresh (`{id,...}`, dùng `id` KHÔNG phải `_id`), khác hẳn `UserProfile`
 *   (`lib/types/user.ts`, document Mongoose thật của `/users/me`, dùng `_id`) — xem ghi chú đầy đủ
 *   trong `lib/types/user.ts`. Giữ ở đây vì gắn chặt với luồng NextAuth
 *   (`app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts` import trực tiếp từ đây).
 */

/**
 * Khớp `AuthTokens` — backend/src/auth/interfaces/auth-tokens.interface.ts.
 * `role` giới hạn đúng `UserRole` enum (common/constants/index.ts): 'user' | 'admin'.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Khớp `PaginationQueryDto` — backend/src/common/dto/pagination-query.dto.ts.
 * Dùng `type` (không phải `interface`) để TypeScript coi là object literal, tự động tương thích
 * với index signature của `QueryParams` (RequestOptions.query) — `interface` không tự động khớp
 * index signature dù cùng cấu trúc, đây là đặc thù type-checking của TypeScript.
 */
export type PaginationQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/** Dùng cho các endpoint chỉ nhận `?limit=` đơn lẻ, không phân trang đầy đủ (vd. films/top,hot...). */
export type LimitQueryParams = {
  limit?: number;
};
