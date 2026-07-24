# Frontend.md — Next.js

## 1. Framework & phiên bản

- **Next.js 14+ (App Router)** — TypeScript
- **Node.js 20 LTS**
- **Package manager**: pnpm

## 2. Stack chi tiết

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js (App Router) | SSR/ISR cho SEO trang phim, Server Components giảm JS client |
| Ngôn ngữ | TypeScript | An toàn kiểu dữ liệu khi làm việc với API backend |
| Styling | Tailwind CSS (+ `tailwind.config` tùy biến design tokens) | Đồng bộ với các file trong `design/` (spacing, color, fontSize tokens) |
| Icon | Material Symbols Outlined | Đã dùng xuyên suốt trong `design/` |
| Font | Geist (Google Fonts) | Đồng bộ với `design/` |
| Data fetching (server) | `fetch` native của Next.js (RSC) + Server Actions | Cho trang public (home, category, detail) |
| Data fetching (client) | TanStack Query (React Query) | Cho phần tương tác: bình luận, yêu thích, lịch sử xem, dashboard |
| Form | React Hook Form + Zod | Validate form đăng nhập/đăng ký, đổi mật khẩu |
| Auth state | NextAuth.js (Credentials Provider) hoặc context tự viết + httpOnly cookie | Access/refresh token từ NestJS |
| Video player | `hls.js` hoặc `video.js` (wrapper component) | Phát link m3u8 lấy từ backend/ophim.cc |
| Global UI state | Zustand (nhẹ) | Trạng thái player, modal, toast — hạn chế dùng Redux |
| SEO | Next.js Metadata API, `next-sitemap` | Meta tag động theo phim, sitemap.xml, OpenGraph |
| Structured data | JSON-LD (schema.org `Movie`/`TVSeries`) | Chèn qua Server Component ở trang chi tiết phim |
| i18n | `next-intl` (mặc định `vi`, mở rộng `en` sau) | UI hiện tại 100% tiếng Việt |
| Testing | Vitest/Jest (unit) + Playwright (E2E) | Test component & luồng xem phim/đăng nhập |
| Lint/Format | ESLint + Prettier + `@typescript-eslint` | Đồng bộ style code |
| Deployment | Vercel | Edge caching, ISR revalidate tự động |

## 3. Cấu trúc thư mục (đề xuất)

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Trang chủ — homepage.html
│   │   ├── phim-le/                  # moviecategory.html (phim lẻ)
│   │   ├── phim-bo/                  # moviecategory.html (phim bộ)
│   │   ├── the-loai/[slug]/          # moviecategory.html theo thể loại
│   │   ├── phim/[slug]/              # moviedentail.html
│   │   ├── xem-phim/[slug]/          # watchmovie.html
│   │   ├── dien-vien/                # actorderectory.html
│   │   └── dien-vien/[slug]/         # actorprofile.html
│   ├── (auth)/
│   │   ├── dang-nhap/
│   │   └── dang-ky/
│   ├── (account)/
│   │   └── user/profile/             # userdasboard.html
│   └── api/                          # Route handlers (proxy/webhook nếu cần)
├── components/
│   ├── layout/                       # TopNavBar, Footer, BottomNav (mobile)
│   ├── film/                         # FilmCard, FilmGrid, EpisodeList
│   ├── actor/                        # ActorCard, AlphabetFilter
│   ├── comment/                      # CommentList, CommentForm, VoteButton
│   ├── player/                       # VideoPlayer wrapper (hls.js)
│   └── ui/                           # Button, Input, Modal (design-system dùng chung)
├── lib/
│   ├── api/                          # API client (fetch wrapper theo module backend)
│   ├── auth/                         # session/token helpers
│   └── utils/
├── hooks/                            # useFavorite, useHistory, usePlaylist...
├── styles/                           # globals.css, tailwind base
├── public/
├── tailwind.config.ts                # Tokens lấy từ design/*.html (colors/spacing/fontSize)
├── next.config.js
└── middleware.ts                     # Bảo vệ route /user/**, refresh token
```

## 4. Chiến lược render theo từng trang

| Trang | Chiến lược | Lý do |
|---|---|---|
| Trang chủ | ISR (revalidate ~60–300s) | Nội dung top phim thay đổi không liên tục, cần SEO |
| Danh sách phim/thể loại | ISR + pagination (SSR cho query params) | SEO tốt, dữ liệu bán tĩnh |
| Chi tiết phim | ISR (revalidate ngắn hơn, ví dụ 60s) | Cần SEO cao nhất, nhưng view/rating cập nhật thường xuyên |
| Trang xem phim | SSR (server component) cho khung trang + CSR cho player/lịch sử xem | Player và tương tác cần client-side |
| Diễn viên (danh sách/hồ sơ) | ISR | Ít thay đổi |
| Đăng nhập/Đăng ký | CSR (client component) | Không cần SEO, cần form tương tác |
| Dashboard tài khoản | CSR + `middleware.ts` auth guard | Dữ liệu riêng tư theo user, không cache |

## 5. Kết nối Backend (NestJS)

- Toàn bộ dữ liệu (films, actors, comments, ratings, favorites, history, playlist, avatar) lấy qua REST API của NestJS — **frontend không gọi thẳng ophim.cc**.
- Base URL API cấu hình qua biến môi trường `NEXT_PUBLIC_API_URL`.
- Access token lưu ở cookie httpOnly (set bởi NestJS khi login) hoặc qua NextAuth session; refresh token flow xử lý ở `middleware.ts`/`lib/auth`.
- Dùng React Query cho các mutation cần optimistic update: vote bình luận, thêm yêu thích, cập nhật lịch sử xem.

## 6. Biến môi trường (`.env.local`)

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## 7. Triển khai

- **Môi trường dev**: `pnpm dev` (Turbopack).
- **Production**: build & deploy trên Vercel, connect với domain, bật ISR + Edge caching cho các route public; route `/user/**` đánh dấu `dynamic = "force-dynamic"` để tránh cache dữ liệu riêng tư.
- Preview deployment tự động theo PR (Vercel Git integration).
