/**
 * EmptyPlayer — Phase 13B: hiển thị khi tập hiện tại không có nguồn phát (`playerType === 'none'`
 * — cả `m3u8Url` lẫn `embedUrl` đều rỗng, hoặc chưa xác định được tập). KHÔNG throw.
 */
export function EmptyPlayer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <p className="text-on-surface-variant text-body-md">Không có nguồn phát.</p>
    </div>
  );
}
