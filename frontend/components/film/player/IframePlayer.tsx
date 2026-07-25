/**
 * IframePlayer — Phase 13B: CHỈ render `<iframe src={embedUrl}>`. KHÔNG overlay, KHÔNG điều khiển
 * — nội dung nhúng từ nguồn thứ 3 (crawler), không có quyền truy cập sự kiện phát bên trong.
 */
export function IframePlayer({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      title="Trình phát video"
      className="absolute inset-0 h-full w-full border-0"
    />
  );
}
