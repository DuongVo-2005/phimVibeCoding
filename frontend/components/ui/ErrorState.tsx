import { Button } from './Button';

/**
 * ErrorState — UI lỗi dùng chung cho mọi section gọi API (Phase 16C). Không chỉ hiện message —
 * luôn kèm nút "Thử lại" gọi `onRetry` (nơi gọi truyền `() => refetch()` từ chính `useQuery` của
 * section đó, không tự quản lý logic retry ở đây).
 */
export function ErrorState({
  message = 'Không tải được dữ liệu.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-xl text-center">
      <span
        className="material-symbols-outlined text-[40px] text-on-surface-variant"
        aria-hidden="true"
      >
        error
      </span>
      <p className="text-body-md text-on-surface-variant">{message}</p>
      <Button variant="secondary" onClick={onRetry} className="px-lg">
        Thử lại
      </Button>
    </div>
  );
}
