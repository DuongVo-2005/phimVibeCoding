import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RoPhim',
  description: 'RoPhim — xem phim trực tuyến',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Material Symbols Outlined — khớp nguyên văn URL trong <head> của design/*.html.
          eslint-disable-next-line: rule no-page-custom-font nhắm vào Pages Router (khuyên đặt
          font ở _document.js dùng chung mọi trang) — đây là App Router root layout, đã CHÍNH LÀ
          nơi áp dụng chung cho mọi route, không phải 1 page riêng lẻ. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
