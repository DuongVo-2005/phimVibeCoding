/**
 * Loading — không có tham chiếu trực tiếp trong design/*.html (mockup tĩnh, không có trạng thái
 * loading). Tự thiết kế tối giản dựa trên token màu đã xác nhận (primary/on-surface-variant),
 * không suy đoán thêm animation/nội dung khác ngoài spinner cơ bản.
 */
export function Loading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-base py-xl text-on-surface-variant">
      <span
        className="material-symbols-outlined animate-spin text-primary text-[32px]"
        aria-hidden="true"
      >
        progress_activity
      </span>
      <span className="text-label-md font-label-md">{label}</span>
    </div>
  );
}
