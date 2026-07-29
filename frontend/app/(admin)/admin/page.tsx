import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Dashboard shell — Admin Foundation phase: KHÔNG có API thống kê nào ở backend (đã audit toàn bộ
 * `backend/src/**` — không có module `dashboard`, không endpoint `stats/overview/top-films/
 * top-users/recent-activity/crawler-summary` nào tồn tại; `implementation_roadmap.md` liệt kê
 * "Dashboard Admin Module" là 1 phase backend RIÊNG, CHƯA triển khai). Theo đúng yêu cầu "Statistic
 * card chỉ render nếu có API — chưa có API thì hiện Empty State", "Không tạo dashboard giả, không
 * mock data" — trang này KHÔNG dựng sẵn card số liệu rồi để trống/bịa số, mà hiện thẳng 1
 * `EmptyState` duy nhất, trung thực về lý do (chưa có API), không đoán trước hình dạng UI cho dữ
 * liệu chưa tồn tại.
 */
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-lg">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Dashboard</h1>
      <EmptyState
        icon="bar_chart"
        message="Chưa có dữ liệu thống kê."
        subtitle="Backend chưa có API Dashboard (tổng quan, top phim, top người dùng, hoạt động gần đây...). Khu vực này sẽ hiển thị khi API sẵn sàng."
      />
    </div>
  );
}
