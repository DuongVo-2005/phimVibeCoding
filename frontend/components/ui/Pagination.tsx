/**
 * Pagination — khớp thanh phân trang trong design/moviecategory.html. Đặt ở `components/ui/`
 * (không phải `components/film/`) vì đây là pattern hiển thị chung, không có logic/dữ liệu riêng
 * cho phim.
 *
 * Phase 17B.1: thêm `onPageChange` (tuỳ chọn) — khi có, các nút chuyển trang trở thành `<button>`
 * thật (gọi callback, disabled đúng ở biên đầu/cuối, focus ring). KHÔNG truyền (mặc định, mọi nơi
 * gọi cũ như `MovieListing.tsx`) → giữ NGUYÊN hành vi tĩnh cũ (`<span>`, không tương tác) — không
 * phá vỡ hành vi hiện có, đúng quyết định Phase 10.3 cho những nơi chưa cần tương tác thật.
 */
export function Pagination({
  currentPage,
  pages,
  lastPage,
  onPageChange,
}: {
  currentPage: number;
  pages: number[];
  lastPage: number;
  onPageChange?: (page: number) => void;
}) {
  const lastShownPage = pages[pages.length - 1];

  return (
    <nav className="flex justify-center items-center gap-md mb-xl" aria-label="Phân trang">
      {onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-white/5 transition-colors duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>
      ) : (
        <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
          <span className="sr-only">Trang trước</span>
        </span>
      )}
      <div className="flex gap-base">
        {pages.map((page) =>
          onPageChange ? (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Trang ${page}`}
              className={
                page === currentPage
                  ? 'w-12 h-12 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center'
                  : 'w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant hover:bg-white/5 transition-colors duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
              }
            >
              {page}
            </button>
          ) : (
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
          ),
        )}
        {lastPage > lastShownPage + 1 ? (
          <span className="flex items-center text-on-surface-variant">...</span>
        ) : null}
        {lastPage > lastShownPage ? (
          onPageChange ? (
            <button
              type="button"
              onClick={() => onPageChange(lastPage)}
              aria-label={`Trang ${lastPage}`}
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant hover:bg-white/5 transition-colors duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {lastPage}
            </button>
          ) : (
            <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant">
              {lastPage}
            </span>
          )
        ) : null}
      </div>
      {onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          aria-label="Trang sau"
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-white/5 transition-colors duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
        </button>
      ) : (
        <span className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
          <span className="sr-only">Trang sau</span>
        </span>
      )}
    </nav>
  );
}
