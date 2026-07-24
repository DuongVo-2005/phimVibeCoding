# Kỹ Năng: Theo Dõi Lịch Sử & Tiến Độ Xem Phim

## Mô Tả
Tính năng này cho phép người dùng lưu lại quá trình xem phim, giúp họ có thể quay lại xem tiếp từ thời điểm đã dừng trước đó một cách dễ dàng.

## Các Công Nghệ Chính
- **React Hooks (useEffect, useRef):** Theo dõi thời gian thực của video đang phát.
- **API Integration:** Gửi dữ liệu tiến độ (phần trăm đã xem, tập phim) về server mỗi giây.
- **Next.js Routing:** Điều hướng người dùng quay lại đúng tập phim và thời điểm đang xem.

## Khả Năng
- **Lưu Tiến Độ Tự Động:** Hệ thống tự động ghi nhận phần trăm đã xem của người dùng sau mỗi giây.
- **Tiếp Tục Xem (Resume):** Khi người dùng quay lại trang phim, một thông báo sẽ hiện lên hỏi họ có muốn tiếp tục xem từ vị trí cũ hay không.
- **Danh Sách "Xem Tiếp":** Một trang riêng trong hồ sơ người dùng hiển thị tất cả các phim đang xem dở kèm theo:
    - Thanh tiến độ trực quan (Progress Bar).
    - Thời gian đã xem so với tổng thời lượng phim.
    - Thông tin tập phim cụ thể đối với phim bộ.
- **Đồng Bộ Hóa:** Tiến độ được lưu theo tài khoản, cho phép người dùng xem tiếp trên các thiết bị khác nhau.
- **Quản Lý Lịch Sử:** Người dùng có thể chủ động xóa phim khỏi danh sách xem tiếp nếu muốn.
