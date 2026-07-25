/**
 * Skeleton — không có tham chiếu trực tiếp trong design/*.html. Tự thiết kế tối giản: khối
 * `animate-pulse` trên nền `surface-container-high` (token màu đã xác nhận), bo góc theo
 * `borderRadius.xl` của design (0.75rem, khớp mặc định Tailwind v4 `rounded-xl`).
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
