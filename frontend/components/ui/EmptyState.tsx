import type { ReactNode } from 'react';

/**
 * EmptyState — không có tham chiếu trực tiếp trong design/*.html. Tự thiết kế tối giản: icon +
 * message, dùng đúng token màu/spacing đã xác nhận, không suy đoán bố cục phức tạp hơn.
 */
export function EmptyState({
  icon = 'inbox',
  message,
  action,
}: {
  icon?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-base py-xl text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
        {icon}
      </span>
      <p className="text-body-md font-body-md">{message}</p>
      {action}
    </div>
  );
}
