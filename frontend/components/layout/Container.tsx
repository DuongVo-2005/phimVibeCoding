import type { ReactNode } from 'react';

/**
 * Container — chỉ áp padding ngang `px-gutter` đúng theo layout gốc design/*.html (các trang
 * dùng `px-gutter` full-width, không giới hạn max-width tổng thể). KHÔNG áp max-width
 * `container-max` (1440px) ở Phase 10.1 theo yêu cầu — token này để dành khi có nhu cầu sau.
 */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-gutter ${className}`.trim()}>{children}</div>;
}
