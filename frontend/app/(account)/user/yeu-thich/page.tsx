import { FavoriteListView } from '@/components/account/FavoriteListView';
import { Container } from '@/components/layout/Container';

/**
 * Route Danh sách yêu thích — Phase 17B.1. Nằm dưới `/user/**`, đã được `middleware.ts` bảo vệ
 * sẵn (matcher `/user/:path*`), không cần sửa middleware. Layout Header/Footer thừa hưởng từ
 * `app/(account)/layout.tsx` (`MainLayout`), giống `/user/profile`, `/user/doi-mat-khau`.
 */
export default function FavoriteListPage() {
  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-lg">Phim yêu thích</h1>
      <FavoriteListView />
    </Container>
  );
}
