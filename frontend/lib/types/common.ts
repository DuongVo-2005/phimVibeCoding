/**
 * Envelope chung của backend — khớp `TransformInterceptor`/`HttpExceptionFilter` thật
 * (backend/src/common/interceptors/transform.interceptor.ts, .../filters/http-exception.filter.ts
 * — xác nhận qua audit mã nguồn thật Phase 11.0, không suy đoán từ api_design.md).
 *
 * Phase 11.2 (quyết định 1): KHÔNG đặt CategoryRef/CountryRef/DirectorRef/ActorRef ở đây — mỗi
 * domain có file type riêng (`lib/types/category.ts`, `country.ts`, `director.ts`, `actor.ts`).
 * File này chỉ chứa type hạ tầng dùng chung cho MỌI domain (envelope, phân trang).
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ErrorResponse;

/** Khớp `PaginatedResponseDto<T>` — backend/src/common/dto/paginated-response.dto.ts. */
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
