/**
 * Phase 12C: chuyển ISO timestamp (`Comment.createdAt` từ backend) thành nhãn tương đối kiểu
 * "X phút/giờ/ngày trước" — khớp định dạng đã dùng trong mock cũ (`_mock/watchmovie-data.ts`,
 * vd. "2 giờ trước"). Không có date-fns/dayjs trong dependencies — thuần `Date` arithmetic, không
 * thêm package mới.
 */
export function formatTimeAgo(isoDate: string): string {
  const diffSeconds = Math.max(Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000), 0);

  if (diffSeconds < 60) return 'Vừa xong';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} năm trước`;
}
