import { HistoryListView } from '@/components/account/HistoryListView';
import { Container } from '@/components/layout/Container';

/**
 * Route Lịch sử xem — Phase 17B.2. Nằm dưới `/user/**`, đã được `middleware.ts` bảo vệ sẵn
 * (matcher `/user/:path*`), không cần sửa middleware. Layout Header/Footer thừa hưởng từ
 * `app/(account)/layout.tsx` (`MainLayout`), giống `/user/yeu-thich`.
 */
export default function HistoryListPage() {
  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-lg">Lịch sử xem</h1>
      <HistoryListView />
    </Container>
  );
}
