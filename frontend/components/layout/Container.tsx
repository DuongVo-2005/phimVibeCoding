import type { ReactNode } from 'react';

/**
 * Container — áp padding ngang `px-gutter` đúng theo layout gốc design/*.html. `maxWidth`
 * (Phase 10.4, D4 — optional, mặc định không giới hạn): nhận class Tailwind max-width (vd.
 * `max-w-screen-2xl`) + tự thêm `mx-auto` để căn giữa — đúng nhu cầu `moviedentail.html`
 * (`max-w-screen-2xl mx-auto`). Không truyền prop này → hành vi y hệt trước Phase 10.4 (không
 * giới hạn/không căn giữa).
 */
export function Container({
  children,
  className = '',
  maxWidth,
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  const maxWidthClasses = maxWidth ? `${maxWidth} mx-auto` : '';
  return <div className={`px-gutter ${maxWidthClasses} ${className}`.trim()}>{children}</div>;
}
