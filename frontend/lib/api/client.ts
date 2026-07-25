import { env } from '@/lib/env';
import { API_PREFIX } from './endpoints';
import { buildQueryString, type QueryParams } from './query-string';
import type { ApiErrorResponse, ApiSuccessResponse } from './types';

/**
 * `NEXT_PUBLIC_API_URL` chỉ chứa domain gốc (không kèm /api/v1) — đã xác nhận với người dùng
 * ở Phase 9.1 (audit trước khi code).
 */
export const apiBaseUrl = `${env.NEXT_PUBLIC_API_URL ?? ''}${API_PREFIX}`;

export class ApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: QueryParams;
  /** Gắn `Authorization: Bearer <accessToken>` nếu có — endpoint Public không cần truyền. */
  accessToken?: string;
}

/**
 * Request helper dùng chung cho toàn frontend (Phase 9.2 — thay thế `authPost` riêng của
 * Phase 9.1). Chỉ chuẩn hoá tầng giao tiếp (method/header/query/envelope) — KHÔNG interceptor,
 * KHÔNG tự refresh-and-retry (refresh token rotation là logic riêng của NextAuth `jwt` callback,
 * xem app/api/auth/[...nextauth]/route.ts), KHÔNG cache.
 *
 * Unwrap đúng envelope {success,data} / {success:false,statusCode,message} — api_design.md §3,
 * khớp `TransformInterceptor`/`HttpExceptionFilter` thật của backend.
 */
export async function request<TData>(path: string, options: RequestOptions = {}): Promise<TData> {
  const { method = 'GET', body, query, accessToken } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}${buildQueryString(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json()) as ApiSuccessResponse<TData> | ApiErrorResponse;

  if (!json.success) {
    const message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
    throw new ApiRequestError(json.statusCode, message);
  }

  return json.data;
}
