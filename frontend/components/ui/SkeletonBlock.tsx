/**
 * SkeletonBlock — khối skeleton tối giản dùng chung cho mọi trạng thái loading (Phase 16C).
 * KHÔNG dùng animation (không pulse/shimmer) — đúng quyết định đã có từ Phase 11.4A
 * (`ContinueWatchingSection`/`TopRatedSection`: "KHÔNG dùng class animation"), giữ nhất quán toàn
 * dự án. Mỗi nơi gọi tự truyền `className` để khớp kích thước ĐÚNG layout thật của nó — component
 * này chỉ là 1 `<div>` màu nền, không tự quyết định hình dạng.
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-surface-container ${className}`.trim()} aria-hidden="true" />;
}
