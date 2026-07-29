import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * Input — form field dùng chung đầu tiên của dự án (Phase 11.1). Mọi input tĩnh trước đây
 * (search box ở `Header`, bộ lọc ở `FilterSidebar`...) đều `readOnly`/decorative, không có state
 * hay thông báo lỗi thật — component này khác: gắn `ref` (bắt buộc cho `react-hook-form`'s
 * `register()`), hiện label + lỗi thật theo `aria-invalid`/`aria-describedby`.
 *
 * Phase 19B.10: thêm `useId()` fallback khi CẢ `id` LẪN `name` đều không được truyền — trước đây
 * `inputId` là `undefined` trong trường hợp này, `<label htmlFor>`/`<input id>` mất liên kết a11y
 * hoàn toàn (lỗi phát hiện qua Manual QA thật — `AdminAvatarView` dùng input điều khiển trực tiếp,
 * không qua `register()`, `getByLabel()` không tìm thấy input). Cùng pattern đã áp dụng cho
 * `components/admin/Select.tsx`.
 */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function Input({ label, error, id, name, className = '', ...rest }, ref) {
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={inputId} className="text-label-md font-label-md text-on-surface-variant">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`bg-surface-container-high border rounded-xl px-md py-base text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/50 transition-all ${error ? 'border-error' : 'border-transparent'} ${className}`.trim()}
        {...rest}
      />
      {error ? (
        <span id={errorId} className="text-label-md text-error">
          {error}
        </span>
      ) : null}
    </div>
  );
});
