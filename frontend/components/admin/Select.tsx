import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Select — dropdown lọc dùng riêng cho khu vực Admin (Phase 19B.1). Đặt trong `components/admin/`
 * (không phải `components/ui/`) — chưa có nơi nào ngoài Admin cần dropdown dạng này, tránh tạo
 * component dùng chung quá sớm (đúng yêu cầu phase). Cùng pattern label + control với
 * `components/ui/Input.tsx` để nhất quán trong `FilterBar`.
 */
export function Select({
  label,
  options,
  placeholder = 'Tất cả',
  includeEmptyOption = true,
  className = '',
  id,
  name,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  /** `false` cho select luôn phải có giá trị thật (vd. Sắp xếp) — không có lựa chọn "Tất cả". */
  includeEmptyOption?: boolean;
}) {
  // `id`/`name` là tuỳ chọn (call site không phải lúc nào cũng truyền) — fallback `useId()` đảm bảo
  // `<label htmlFor>` luôn khớp với `<select id>` thật, tránh mất liên kết a11y (label/control rời
  // nhau khi cả 2 prop đều thiếu — lỗi phát hiện qua Manual QA thật bằng Playwright `getByLabel`).
  const generatedId = useId();
  const selectId = id ?? name ?? generatedId;

  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={selectId} className="text-label-md font-label-md text-on-surface-variant">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className={`bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`.trim()}
        {...rest}
      >
        {includeEmptyOption ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
