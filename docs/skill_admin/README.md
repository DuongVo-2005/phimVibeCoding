#  Film CMS (CRM)

## Tổng Quan
Đây là hệ thống quản trị nội dung (CMS/CRM) chuyên dụng cho dự án **Phim Mới**. Hệ thống cho phép quản lý toàn bộ dữ liệu phim, diễn viên, danh mục, và đặc biệt là tích hợp công cụ crawl phim từ các nguồn bên ngoài.

## Các Tính Năng Chính
- **Bảng Điều Khiển (Dashboard):** Hiển thị thống kê và tổng quan hệ thống.
- **Quản Lý Phim (Film Management):** Thêm, sửa, xóa phim, quản lý tập phim và link phim.
- **Quản Lý Metadata:** Quản lý danh sách diễn viên, thể loại, quốc gia và định dạng phim.
- **Hệ Thống Crawl (Crawl System):** 
    - Crawl dữ liệu phim tự động từ các nguồn bên ngoài.
    - Hỗ trợ crawl từ các trang phim đối tác hoặc nguồn mở.
- **Quản Lý Hệ Thống:**
    - Quản lý Redis cache.
    - Quản lý Job (các tác vụ chạy ngầm).
    - Quản lý Team và phân quyền Admin.
- **Quản Lý Tài Nguyên:** Quản lý hình ảnh, avatar và các tệp tin đa phương tiện.

## Công Nghệ Sử Dụng
- **Core Framework:** React 18 (Vite)
- **UI Framework:** Ant Design (antd) & Ant Design Pro Components
- **Quản Lý Trạng Thái:** Redux Toolkit
- **Lấy Dữ Liệu:** React Query (v3) & Axios
- **Routing:** React Router Dom v6
- **Styling:** Tailwind CSS & Sass
- **Biểu Đồ:** Recharts
- **Form:** React Hook Form & Yup
- **Khác:** React Quill (Rich Text Editor), xlsx (Xuất file Excel)

## Cấu Trúc Thư Mục
- `src/pages/admin`: Chứa các module quản trị chính.
- `src/components`: Các thành phần giao diện dùng chung.
- `src/redux`: Định nghĩa store và các slice cho trạng thái ứng dụng.
- `src/hooks`: Các custom hooks xử lý logic.
- `src/helper` & `src/utils`: Các hàm tiện ích và xử lý dữ liệu.
