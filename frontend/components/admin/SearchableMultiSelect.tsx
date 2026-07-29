'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface SelectableItem {
  _id: string;
  name: string;
}

/**
 * SearchableMultiSelect — ô chọn nhiều (quốc gia/đạo diễn/diễn viên/thể loại) cho form phim
 * (Phase 19B.2). Cần component riêng vì `directors`/`actors` CÓ phân trang + `search` ở backend
 * (không thể dump hết vào 1 `<select multiple>` như `categories`/`countries` — audit
 * `query-director.dto.ts`/`query-actor.dto.ts`), nên dùng ĐỒNG NHẤT 1 kiểu UX search-to-select cho
 * cả 4 field thay vì 2 kiểu khác nhau trên cùng 1 form.
 *
 * Component THUẦN kiểm soát (controlled) — không tự fetch dữ liệu (`options` do `MovieForm` truyền
 * vào, tự quyết định lọc client-side hay gọi API theo `search`), giữ đúng nguyên tắc data-fetching
 * nằm ở tầng logic, không chôn trong UI atom (khớp `AdminTable`/`FilterBar`).
 */
export function SearchableMultiSelect({
  label,
  selected,
  onAdd,
  onRemove,
  searchValue,
  onSearchChange,
  options,
  isLoading = false,
  placeholder = 'Gõ để tìm...',
}: {
  label: string;
  selected: SelectableItem[];
  onAdd: (item: SelectableItem) => void;
  onRemove: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  options: SelectableItem[];
  isLoading?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedIds = new Set(selected.map((item) => item._id));
  const candidates = options.filter((option) => !selectedIds.has(option._id));

  return (
    <div className="flex flex-col gap-xs" ref={containerRef}>
      <label htmlFor={inputId} className="text-label-md font-label-md text-on-surface-variant">
        {label}
      </label>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-xs">
          {selected.map((item) => (
            <span
              key={item._id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary text-label-md px-sm py-1"
            >
              {item.name}
              <button
                type="button"
                onClick={() => onRemove(item._id)}
                aria-label={`Bỏ chọn ${item.name}`}
                className="material-symbols-outlined text-[16px] hover:text-error"
              >
                close
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={searchValue}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />

        {isOpen ? (
          <div className="absolute z-10 mt-xs w-full max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-surface-container-high shadow-lg">
            {isLoading ? (
              <p className="px-md py-sm text-label-md text-on-surface-variant">Đang tải...</p>
            ) : candidates.length === 0 ? (
              <p className="px-md py-sm text-label-md text-on-surface-variant">Không có kết quả.</p>
            ) : (
              candidates.map((option) => (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => {
                    onAdd(option);
                    onSearchChange('');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-md py-sm text-body-md text-on-surface hover:bg-white/5 transition-colors"
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
