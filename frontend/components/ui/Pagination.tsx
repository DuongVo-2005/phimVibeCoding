/**
 * Pagination — khớp thanh phân trang trong design/moviecategory.html. Đặt ở `components/ui/`
 * (không phải `components/film/`) vì đây là pattern hiển thị chung, không có logic/dữ liệu riêng
 * cho phim. CHỈ UI tĩnh — không onClick, không điều hướng thật (Phase 10.3 đã xác nhận không cho
 * phép tương tác tại chỗ).
 */
export function Pagination({
  currentPage,
  pages,
  lastPage,
}: {
  currentPage: number;
  pages: number[];
  lastPage: number;
}) {
  return (
    <nav className="flex justify-center items-center gap-md mb-xl" aria-label="Phân trang">
      <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined" aria-hidden="true">
          chevron_left
        </span>
        <span className="sr-only">Trang trước</span>
      </span>
      <div className="flex gap-base">
        {pages.map((page) => (
          <span
            key={page}
            aria-current={page === currentPage ? 'page' : undefined}
            className={
              page === currentPage
                ? 'w-12 h-12 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center'
                : 'w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant'
            }
          >
            {page}
          </span>
        ))}
        {lastPage > pages[pages.length - 1] + 1 ? (
          <span className="flex items-center text-on-surface-variant">...</span>
        ) : null}
        {lastPage > pages[pages.length - 1] ? (
          <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant">
            {lastPage}
          </span>
        ) : null}
      </div>
      <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined" aria-hidden="true">
          chevron_right
        </span>
        <span className="sr-only">Trang sau</span>
      </span>
    </nav>
  );
}
