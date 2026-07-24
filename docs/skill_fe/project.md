# Phim Mới Project

## Tổng Quan
Dự án **Phim Mới** là một nền tảng xem phim trực tuyến hiện đại được xây dựng bằng **Next.js**. Dự án cung cấp giao diện người dùng tối ưu, khả năng phát video chất lượng cao và hệ thống quản lý phim đa dạng.

## Các Tính Năng Chính
- **Trang Chủ (Home):** Hiển thị các phim mới cập nhật, phim hot, và các bộ sưu tập phim theo slider.
- **Danh Sách Phim (Listing):** Phân loại phim theo thể loại, quốc gia, năm phát hành.
- **Chi Tiết Phim:** Cung cấp thông tin đầy đủ về phim, diễn viên, nội dung và các đề xuất liên quan.
- **Xem Phim (Streaming):** Trình phát video chuyên nghiệp hỗ trợ HLS (m3u8) với Artplayer.
- **Tìm Kiếm (Search):** Tìm kiếm phim nhanh chóng theo tên.
- **Thông Tin Diễn Viên:** Trang chi tiết về các diễn viên và danh sách phim họ tham gia.
- **Quản Lý Người Dùng:** Hệ thống đăng nhập, đăng ký và thông tin cá nhân.
- **Đa Nguồn Dữ Liệu:** Hỗ trợ tích hợp dữ liệu từ nhiều nguồn khác nhau (Dongphim, Ghienphim, Motphim, Subnhanh).

## Công Nghệ Sử Dụng
- **Framework:** Next.js 15 (App Router)
- **Ngôn Ngữ:** TypeScript
- **Styling:** Tailwind CSS
- **Phát Video:** Artplayer.js, Hls.js
- **Quản Lý Trạng Thái & Dữ Liệu:** TanStack Query (React Query), SWR, Axios
- **UI Components:** Lucide Icons, React Icons, Swiper/Keen-slider (Slider)
- **Deployment:** Hỗ trợ Cloudflare Pages (Next-on-Pages)

## Cấu Trúc Thư Mục
- `src/app`: Định nghĩa các route và trang của ứng dụng.
- `src/component`: Các thành phần giao diện dùng chung (Header, Footer, MovieCard, Player...).
- `src/services`: Xử lý gọi API và tương tác dữ liệu.
- `src/hooks`: Các logic React custom.
- `src/context`: Quản lý trạng thái toàn cục của ứng dụng.
