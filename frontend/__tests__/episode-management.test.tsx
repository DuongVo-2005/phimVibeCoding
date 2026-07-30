import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { EpisodeManagement } from '../components/admin/EpisodeManagement';
import { NotificationProvider } from '../components/providers/notification-provider';

// Cùng triết lý `user-dashboard.test.tsx`/`notification-bell.test.tsx`: KHÔNG mock fetch, không
// có backend thật trong môi trường test — `session={null}` khiến `episodesQueryOptions.byFilm`
// (`enabled: Boolean(accessToken) && Boolean(filmId)`) bị disable, danh sách dừng ở trạng thái
// rỗng (không loading/error thật). Các tương tác mở/đóng dialog Add là state cục bộ (không cần
// gọi API) nên assert được đầy đủ.
describe('EpisodeManagement', () => {
  const renderView = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <SessionProvider session={null}>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <EpisodeManagement filmId="film-1" filmTitle="Phim Test" />
          </QueryClientProvider>
        </NotificationProvider>
      </SessionProvider>,
    );
  };

  it('renders without throwing while session is unauthenticated', () => {
    const { container } = renderView();
    expect(container.firstChild).not.toBeNull();
  });

  it('chưa đăng nhập -> query bị disable, hiện trạng thái rỗng', () => {
    renderView();
    expect(screen.getByText('Phim này chưa có tập nào.')).toBeInTheDocument();
  });

  it('bấm "Thêm tập" -> mở dialog Add với đúng tiêu đề', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm tập' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Thêm tập phim')).toBeInTheDocument();
  });

  it('mở dialog Add rồi bấm Huỷ -> đóng dialog', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm tập' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mở dialog Add rồi nhấn Escape -> đóng dialog', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm tập' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dialog Add hiện đủ field bắt buộc theo spec (số tập, tên tập, công khai)', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm tập' }));
    expect(screen.getByLabelText('Số tập')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên tập')).toBeInTheDocument();
    expect(screen.getByLabelText('Embed URL')).toBeInTheDocument();
    expect(screen.getByLabelText('M3U8 URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Subtitle URL')).toBeInTheDocument();
    expect(
      screen.getByText('Hiển thị công khai (bỏ chọn để ẩn tập khỏi trang người dùng)'),
    ).toBeInTheDocument();
  });
});
