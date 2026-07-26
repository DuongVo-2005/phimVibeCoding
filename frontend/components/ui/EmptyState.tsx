import type { ReactNode } from 'react';

/**
 * EmptyState — không có tham chiếu trực tiếp trong design/*.html. Tự thiết kế tối giản: icon +
 * message, dùng đúng token màu/spacing đã xác nhận, không suy đoán bố cục phức tạp hơn.
 *
 * Phase 16C: thêm `subtitle` (tuỳ chọn) — dùng cho Search/MovieListing/Thể loại/Quốc gia khi
 * không có kết quả ("Không tìm thấy phim." + "Hãy thử từ khóa khác."), không đổi 3 prop gốc.
 */
export function EmptyState({
  icon = 'inbox',
  message,
  subtitle,
  action,
}: {
  icon?: string;
  message: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-base py-xl text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
        {icon}
      </span>
      <p className="text-body-md font-body-md">{message}</p>
      {subtitle ? <p className="text-label-md">{subtitle}</p> : null}
      {action}
    </div>
  );
}
