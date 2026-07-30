import { NotificationListView } from '@/components/account/NotificationListView';
import { Container } from '@/components/layout/Container';

/**
 * Route Thông báo — Phase 34. Nằm dưới `/user/**`, đã được `middleware.ts` bảo vệ sẵn (matcher
 * `/user/:path*`). Layout Header/Footer thừa hưởng từ `app/(account)/layout.tsx` (`MainLayout`).
 *
 * Không lặp `<h1>` ở đây (khác `/user/lich-su`, `/user/yeu-thich`) — `NotificationListView` tự
 * render tiêu đề CHUNG 1 hàng với nút "Đánh dấu tất cả đã đọc" (trạng thái nút phụ thuộc dữ liệu
 * fetch bên trong view, không tách ra page level được) — cùng cách mọi `Admin*ListView` đã làm cho
 * trang có action ở header, khác History/Favorite (không có action nào ở header nên tách được).
 */
export default function NotificationListPage() {
  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg">
      <NotificationListView />
    </Container>
  );
}
