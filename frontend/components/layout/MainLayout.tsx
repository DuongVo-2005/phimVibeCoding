import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/**
 * MainLayout — bố cục trang public dùng chung: Header (fixed, cao h-20) + nội dung + Footer.
 * `pt-20` bù đúng chiều cao Header cố định; `pb-20 md:pb-0` chừa chỗ cho bottom nav (chỉ hiện
 * dưới md) — không suy đoán thêm ngoài các giá trị đã xác nhận từ design/*.html.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-20 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
