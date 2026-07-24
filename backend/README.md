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
npm run start:dev
```

API mặc định chạy tại `http://localhost:3000/api/v1`, tài liệu Swagger tại `http://localhost:3000/api/docs`.

Health check: `GET /api/v1/health` (kiểm tra kết nối MongoDB qua `@nestjs/terminus`).

## Chạy toàn bộ bằng Docker (API + MongoDB)

```bash
docker compose up -d --build
```

## Cấu trúc thư mục

Xem chi tiết trong [`backend.md`](../backend.md) mục 3. Tóm tắt:

```
src/
├── auth/            # đăng ký/đăng nhập/refresh token
├── users/            # hồ sơ, avatar, đổi mật khẩu
├── films/            # phim + tập phim
├── actors/           # diễn viên
├── types/            # thể loại
├── comments/         # bình luận + vote
├── ratings/           # đánh giá phim
├── favorites/         # yêu thích phim/diễn viên
├── histories/          # lịch sử xem / xem tiếp
├── playlists/          # danh mục do user tạo
├── avatars/             # avatar mẫu (type + image)
├── film-reports/        # báo lỗi phim
├── crawler/              # đồng bộ dữ liệu từ ophim.cc
├── health/               # health check
├── common/               # guard, decorator, filter, interceptor dùng chung
├── config/                # cấu hình + validate biến môi trường
└── database/              # kết nối Mongoose
```

## Ghi chú triển khai so với `backend.md`

- **Crawler queue**: bản này dùng `@nestjs/schedule` (cron) kết hợp giới hạn concurrency bằng `p-limit`, **không dùng BullMQ/Redis** để giảm phụ thuộc hạ tầng khi chạy local/demo (`docker-compose.yaml` chỉ có MongoDB theo yêu cầu). Có thể nâng cấp sang BullMQ + Redis sau này mà không đổi API — chỉ cần thay `CrawlerService` gọi job qua queue thay vì gọi trực tiếp trong cron callback.
- **Cache Redis**: chưa bật (không bắt buộc để chạy); các danh sách "top phim" hiện tính trực tiếp từ MongoDB (đã có index phù hợp trong `database_schema.md`).
- Toàn bộ endpoint auth-protected dùng `JwtAuthGuard` (global) + decorator `@Public()` để đánh dấu route công khai, và `@Roles('admin')` + `RolesGuard` cho các route quản trị (CRUD types/actors, quản lý film-reports, trigger crawler thủ công).
