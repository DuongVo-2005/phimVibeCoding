# Movie Crawler Documentation

Tài liệu này mô tả chi tiết về hệ thống cào dữ liệu (Crawler) được tích hợp trong dự án, sử dụng API từ `ophim.cc`.

## Cấu trúc hệ thống

Hệ thống bao gồm 3 thành phần chính:
1. **Proxy API (Backend)**: Nằm trong `server.ts`, đóng vai trò trung gian để tránh lỗi CORS khi gọi trực tiếp API OPhim từ trình duyệt.
2. **Scraper Service (Logic)**: `src/lib/scraper.ts` chứa logic xử lý dữ liệu, mapping model và đồng bộ với Firestore.
3. **Crawler Dashboard (UI)**: `src/pages/AdminCrawler.tsx` cung cấp giao diện quản lý, cấu hình và theo dõi quá trình cào phim.

## Các Endpoint API sử dụng (Proxy)

- `GET /api/crawl/ophim?page={page}`: Lấy danh sách phim mới cập nhật theo trang.
- `GET /api/crawl/ophim/detail?slug={slug}`: Lấy thông tin chi tiết của một bộ phim bao gồm danh sách tập phim và link server.

## Quy trình đồng bộ dữ liệu

Khi bắt đầu quá trình cào, hệ thống sẽ thực hiện các bước sau cho mỗi bộ phim:

1. **Fetch Detail**: Gọi API chi tiết để lấy toàn bộ thông tin (tên, mô tả, năm, diễn viên, đạo diễn, thể loại...).
2. **URL Normalization**: Chuyển đổi các link ảnh (thumb, poster) từ dạng tương đối sang tuyệt đối (sử dụng host của OPhim).
3. **Firestore Sync**:
    - Sử dụng `slug` làm ID tài liệu để tránh trùng lặp.
    - Sử dụng `setDoc` với option `{ merge: true }` để cập nhật thông tin mới mà không làm mất dữ liệu cũ.
4. **Episode Sync**: 
    - Các tập phim được lưu vào sub-collection `episodes` của từng phim.
    - ID của tập phim được kết hợp giữa `server_name` và `slug` tập để đảm bảo tính duy nhất.

## Hướng dẫn sử dụng

1. Truy cập vào trang Quản trị Crawler (`/admin/crawler`).
2. Nhập khoảng trang muốn cào (ví dụ: từ trang 1 đến trang 3).
3. Nhấn **Bắt đầu cào**.
4. Theo dõi log thời gian thực:
    - **Màu trắng**: Thông tin tiến trình.
    - **Màu xanh**: Đồng bộ thành công.
    - **Màu đỏ**: Lỗi (API timeout, lỗi Firestore...).

## Lưu ý kỹ thuật

- **Rate Limiting**: Giữa mỗi lần đồng bộ phim có một khoảng nghỉ ngắn (500ms) để tránh làm quá tải API nguồn và database.
- **Security**: Chỉ người dùng có quyền `isAdmin` mới có thể truy cập và thực hiện thao tác cào phim.
- **Data Model**: Dữ liệu được tối ưu hóa để tương thích với cấu trúc hiển thị của Frontend (React 19).

---
*Cập nhật lần cuối: 23/04/2026*
