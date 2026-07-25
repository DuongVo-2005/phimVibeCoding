import type { ReactNode } from 'react';

/**
 * Section — khớp pattern lặp lại nhiều lần trong design/*.html:
 * `<section class="px-gutter"><h2 class="text-headline-lg font-headline-lg">...</h2>...</section>`
 * (vd. "Tiếp tục xem", "Đang thịnh hành", "Gợi ý riêng cho bạn"...).
 */
export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-gutter ${className}`.trim()}>
      {title ? (
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-headline-lg font-headline-lg">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
