const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * AlphabetFilter — khớp bộ lọc A-Z trong `design/actorderectory.html`. Quyết định C (Phase 10.6):
 * UI TĨNH HOÀN TOÀN — không `useState`, không `onClick`, không filter, không business logic. "Tất
 * cả" luôn là mục active duy nhất (đúng trạng thái mặc định của design), các chữ cái chỉ là
 * `<button>` trang trí (giữ semantics nút bấm cho a11y, cùng quy ước các nút tĩnh khác trong dự án
 * như `CommentSection`/`Header`) — KHÔNG có handler nào gắn vào.
 */
export function AlphabetFilter() {
  return (
    <div className="flex items-center gap-xs overflow-x-auto pb-2">
      <button
        type="button"
        className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-label-md font-label-md whitespace-nowrap"
      >
        Tất cả
      </button>
      {ALPHABET.map((char) => (
        <button
          key={char}
          type="button"
          className="px-3.5 py-1.5 rounded-lg text-label-md font-label-md text-on-surface-variant whitespace-nowrap"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
