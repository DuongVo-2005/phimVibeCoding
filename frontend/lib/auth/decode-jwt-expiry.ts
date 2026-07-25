/**
 * Đọc claim `exp` (giây, epoch) trực tiếp từ JWT access/refresh token do backend phát hành,
 * quy đổi ra mili-giây. Không tin vào giá trị JWT_ACCESS_EXPIRES cấu hình cứng phía FE (vì FE
 * không biết giá trị thật backend đang chạy — .env.example chỉ là default, có thể bị override) —
 * JWT tự mô tả thời hạn của chính nó qua chuẩn `exp`, đây là cách xác định đúng, không suy đoán.
 *
 * Pure function, không gọi network — dùng trong NextAuth `jwt` callback (route handler, Node.js
 * runtime). Dùng `Buffer` nên KHÔNG dùng trực tiếp trong middleware (Edge runtime).
 */
export function decodeJwtExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload: unknown = JSON.parse(payloadJson);

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'exp' in payload &&
      typeof (payload as { exp: unknown }).exp === 'number'
    ) {
      return (payload as { exp: number }).exp * 1000;
    }

    return null;
  } catch {
    return null;
  }
}
