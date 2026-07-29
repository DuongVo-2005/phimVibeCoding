'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * ConfirmDialog — hộp thoại xác nhận dùng chung cho các thao tác phá huỷ trong Admin (Phase
 * 19B.2, mở đầu bằng Delete Movie — hard delete, không khôi phục được, xem audit Phase 19B). Đây
 * là "ConfirmButton nhỏ" đã được duyệt trước ở Phase 19B.1 nhưng chưa build (lúc đó chưa có hành
 * động nào cần xác nhận) — dựng dạng Dialog (không phải Button) vì cần hiện rõ tên đối tượng sắp
 * xoá + cảnh báo không thể hoàn tác trước khi người dùng xác nhận.
 *
 * Không có Modal/Dialog nào có sẵn trong dự án (đã audit ở Phase 19B) — tự dựng tối giản: overlay
 * + panel giữa màn hình, đóng bằng Escape hoặc bấm ra ngoài, `role="dialog"` + `aria-modal`.
 *
 * Phát hiện qua Manual QA thật (Phase 19B.4, đo `getComputedStyle` + screenshot khi nút "Xoá" của
 * dialog nằm ngoài viewport không click được): panel dùng `max-w-sm` — TECH-DEBT-001 đã ghi nhận ở
 * `notification-provider.tsx` (token `--spacing-sm` tự định nghĩa trong globals.css đè lên scale
 * `max-w-*` mặc định của Tailwind, `max-w-sm` thực ra chỉ ra ~12px thay vì 24rem, khiến text bọc
 * từng chữ một dòng và panel cao hơn viewport). Dùng `max-w-[24rem]` (arbitrary value) theo đúng
 * convention đã có, KHÔNG dùng tên scale `sm/md/lg` cho `max-w-*` ở bất kỳ đâu trong dự án.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  isLoading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-md"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[24rem] flex-col gap-md rounded-2xl bg-surface-container p-lg"
      >
        <h2 id="confirm-dialog-title" className="text-headline-md font-headline-md text-on-surface">
          {title}
        </h2>
        <p className="text-body-md text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-sm mt-sm">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-error text-on-error shadow-error/20 hover:bg-error/90"
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
