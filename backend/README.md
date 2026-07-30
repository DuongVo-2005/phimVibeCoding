# RoPhim Backend (NestJS + MongoDB)

Backend API cho website xem phim, xây dựng theo [`project.md`](../project.md) và [`backend.md`](../backend.md).

## Yêu cầu

- Node.js 20 LTS
- npm (hoặc pnpm)
- Docker + Docker Compose (để chạy MongoDB)

## Cài đặt & chạy

```bash
cd backend
cp .env.example .env    # chỉnh JWT secrets nếu cần
docker compose up -d mongodb   # chỉ chạy MongoDB bằng Docker
npm install
npm run seed:rbac       # tạo role/permission mặc định (admin/user) — bắt buộc, nếu không mọi route @RequirePermission() sẽ không có ai truy cập được
npm run seed:admin      # tạo tài khoản admin từ ADMIN_EMAIL/ADMIN_PASSWORD trong .env
npm run start:dev
```

`MAIL_HOST` trong `.env` có thể để trống khi chạy local/demo — `MailService` tự log token xác thực email/reset password ra console thay vì gửi SMTP thật (xem `.env.example`). Điền đủ `MAIL_HOST/PORT/USER/PASS/FROM` để gửi email thật.

API mặc định chạy tại `http://localhost:3000/api/v1`, tài liệu Swagger tại `http://localhost:3000/api/docs`.

Health check: `GET /api/v1/health` (kiểm tra kết nối MongoDB qua `@nestjs/terminus`).

### Seed & migration scripts

- `npm run seed:rbac` — tạo/đồng bộ các `permissions` + role `admin`/`user` mặc định, và backfill `roleIds` cho user hiện có (dựa trên field `role` cũ). Chạy được nhiều lần (idempotent).
- `npm run seed:admin` — tạo tài khoản admin đầu tiên từ `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` trong `.env`. Bỏ qua nếu email đã tồn tại.
- `npm run migrate:categories`, `npm run migrate:film-refs`, `npm run migrate:films-stabilization`, `npm run migrate:comments-hidden` — các script migrate **một lần** (one-off) cho dữ liệu cũ (đổi tên collection `types`→`categories`, chuyển `films.country/director` dạng chuỗi sang ref `countries/directors`, đổi tên field `films.types`→`films.categories` + backfill `isPublished`, backfill `comments.isHidden`). **Không bắt buộc** với database mới tạo (không có dữ liệu cũ để migrate); chỉ cần chạy khi nâng cấp một database đã tồn tại từ schema cũ, theo đúng thứ tự liệt kê ở trên.

## Chạy toàn bộ bằng Docker (API + MongoDB)

```bash
docker compose up -d --build
```

## Cấu trúc thư mục

Xem chi tiết trong [`backend.md`](../backend.md) mục 3. Tóm tắt:

```
src/
├── auth/              # đăng ký/đăng nhập/refresh token/quên-đặt lại mật khẩu/verify email
├── users/              # hồ sơ, đổi mật khẩu
├── films/               # phim (embedded episodes dùng cho crawler + trang xem công khai)
├── episodes/             # quản lý tập phim cho admin (collection riêng, xem episode.schema.ts)
├── actors/                # diễn viên
├── directors/              # đạo diễn
├── categories/              # thể loại (đổi tên từ "types")
├── countries/                # quốc gia
├── comments/                  # bình luận + vote
├── ratings/                     # đánh giá phim
├── favorites/                    # yêu thích phim/diễn viên
├── histories/                     # lịch sử xem / xem tiếp
├── playlists/                      # danh mục do user tạo
├── avatars/                         # avatar mẫu (type + image)
├── uploads/                          # upload file thật (poster/thumbnail/avatar) — Phase 31
├── mail/                              # gửi email qua SMTP, dev-only console fallback — Phase 33
├── notifications/                      # thông báo trong app cho user — Phase 34
├── dashboard/                           # thống kê tổng quan cho admin — Phase 32
├── film-reports/                         # báo lỗi phim
├── crawler/                                # đồng bộ dữ liệu từ ophim.cc
├── crawler-history/                         # lịch sử các lần crawl
├── roles/, permissions/, role-permissions/    # RBAC
├── health/                                     # health check
├── common/                                      # guard, decorator, filter, interceptor dùng chung
├── config/                                       # cấu hình + validate biến môi trường
└── database/                                      # kết nối Mongoose, seed & migration scripts
```

## Ghi chú triển khai so với `backend.md`

- **Crawler queue**: bản này dùng `@nestjs/schedule` (cron) kết hợp giới hạn concurrency bằng `p-limit`, **không dùng BullMQ/Redis** để giảm phụ thuộc hạ tầng khi chạy local/demo (`docker-compose.yaml` chỉ có MongoDB theo yêu cầu). Có thể nâng cấp sang BullMQ + Redis sau này mà không đổi API — chỉ cần thay `CrawlerService` gọi job qua queue thay vì gọi trực tiếp trong cron callback.
- **Cache Redis**: chưa bật (không bắt buộc để chạy); các danh sách "top phim" hiện tính trực tiếp từ MongoDB (đã có index phù hợp trong `database_schema.md`).
- Toàn bộ endpoint auth-protected dùng `JwtAuthGuard` (global) + decorator `@Public()` để đánh dấu route công khai, và `@Roles('admin')` + `RolesGuard` cho các route quản trị (CRUD types/actors, quản lý film-reports, trigger crawler thủ công).
