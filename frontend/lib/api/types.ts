/**
 * Kiểu dữ liệu envelope chung của backend — theo api_design.md §3 (Cross-cutting conventions).
 * Chỉ khai báo type, không có logic.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Khớp `PaginatedResponseDto` — backend/src/common/dto/paginated-response.dto.ts */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

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

/** Khớp `PaginationQueryDto` — backend/src/common/dto/pagination-query.dto.ts */
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Dùng cho các endpoint chỉ nhận `?limit=` đơn lẻ, không phân trang đầy đủ (vd. films/top,hot...). */
export interface LimitQueryParams {
  limit?: number;
}
