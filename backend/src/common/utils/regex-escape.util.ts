/**
 * Escape ký tự đặc biệt của regex trong chuỗi input người dùng trước khi đưa vào `new RegExp()`.
 * Phát hiện qua Final Audit: `users.service.ts`/`actors.service.ts` dựng `RegExp` trực tiếp từ
 * `query.search`/`query.letter` (chuỗi client gửi lên) mà không escape — rủi ro ReDoS (regex thảm
 * hoạ backtracking, vd `(a+)+$`) và lỗi 500 khi input chứa ký tự regex không hợp lệ (`(`, `[`...).
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
