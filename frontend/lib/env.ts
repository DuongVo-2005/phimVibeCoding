/**
 * Đọc biến môi trường — đúng 4 biến đã liệt kê ở frontend.md §6, không thêm biến nào khác.
 *
 * Chưa có schema validate (Zod) ở đây: frontend.md không quy định cơ chế validate env cho
 * frontend — "không đủ căn cứ" để tự thêm, khác với backend (có env.validation.ts dùng Joi,
 * được api_design.md/backend.md nêu rõ). Đây chỉ là truy cập có kiểu (typed), không có logic.
 */
export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const;
