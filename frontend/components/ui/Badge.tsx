import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'primary';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  // Khớp badge "4K"/"HDR"/"IMAX" trên poster trong design/*.html.
  default: 'bg-white/20 text-white',
  // Khớp badge "#1 Xu hướng tuần này" / nhãn IMDb trong design/*.html.
  primary: 'bg-primary/20 text-primary border border-primary/30',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded text-[10px] font-bold px-2 py-0.5 ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
