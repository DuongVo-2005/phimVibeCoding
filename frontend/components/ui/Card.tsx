import type { ReactNode } from 'react';

/**
 * Card — nền `surface-container` bo góc, dùng chung cho các khối nội dung dạng thẻ (khớp màu
 * nền `bg-surface-container`/`rounded-xl` lặp lại trong design/*.html). Không dùng biến thể
 * "glass panel" làm mặc định — hiệu ứng đó chỉ xuất hiện ở 5/7 trang, không phải baseline chung.
 */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-container rounded-xl overflow-hidden ${className}`.trim()}>
      {children}
    </div>
  );
}
