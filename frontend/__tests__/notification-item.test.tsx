import { fireEvent, render, screen } from '@testing-library/react';
import { NotificationItem } from '../components/notifications/NotificationItem';
import type { Notification } from '../lib/types/notification';

const buildNotification = (overrides: Partial<Notification> = {}): Notification => ({
  _id: 'n1',
  userId: 'user-1',
  type: 'system',
  title: 'Tiêu đề thông báo',
  message: 'Nội dung thông báo',
  metadata: null,
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('NotificationItem', () => {
  it('chưa đọc -> hiện chấm "Chưa đọc"', () => {
    render(<NotificationItem notification={buildNotification({ isRead: false })} />);
    expect(screen.getByTitle('Chưa đọc')).toBeInTheDocument();
  });

  it('đã đọc -> KHÔNG hiện chấm "Chưa đọc"', () => {
    render(<NotificationItem notification={buildNotification({ isRead: true })} />);
    expect(screen.queryByTitle('Chưa đọc')).not.toBeInTheDocument();
  });

  it('chế độ đầy đủ (compact=false, mặc định): hiện nút "Đánh dấu đã đọc" + "Xoá", gọi đúng callback', () => {
    const onMarkRead = jest.fn();
    const onDelete = jest.fn();
    render(
      <NotificationItem
        notification={buildNotification({ isRead: false })}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }));
    expect(onMarkRead).toHaveBeenCalledWith('n1');

    fireEvent.click(screen.getByRole('button', { name: 'Xoá' }));
    expect(onDelete).toHaveBeenCalledWith('n1');
  });

  it('đã đọc (compact=false) -> KHÔNG hiện nút "Đánh dấu đã đọc" (chỉ còn "Xoá")', () => {
    render(<NotificationItem notification={buildNotification({ isRead: true })} />);
    expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xoá' })).toBeInTheDocument();
  });

  it('chế độ compact (dropdown): KHÔNG hiện nút "Xoá", bấm cả dòng để đánh dấu đã đọc', () => {
    const onMarkRead = jest.fn();
    render(
      <NotificationItem
        notification={buildNotification({ isRead: false })}
        compact
        onMarkRead={onMarkRead}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Xoá' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('compact + ĐÃ đọc -> bấm cả dòng KHÔNG gọi onMarkRead (đã đọc rồi, không cần đánh dấu lại)', () => {
    const onMarkRead = jest.fn();
    render(
      <NotificationItem
        notification={buildNotification({ isRead: true })}
        compact
        onMarkRead={onMarkRead}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onMarkRead).not.toHaveBeenCalled();
  });
});
