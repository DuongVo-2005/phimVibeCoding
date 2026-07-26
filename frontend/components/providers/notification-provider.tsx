'use client';

import { createContext, useCallback, useMemo, useRef, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
}

export const NotificationContext = createContext<NotificationApi | null>(null);

const DISMISS_AFTER_MS = 3500;

const TYPE_CLASSES: Record<NotificationType, string> = {
  success: 'border-primary/40',
  error: 'border-red-500/50',
  info: 'border-white/15',
};

/**
 * Phase 15A: notification layer nội bộ CHUẨN của project (không phải giải pháp tạm) — dự án không
 * có toast/snackbar/notification nào trước đó (đã xác nhận qua audit: không có package
 * sonner/react-hot-toast/notistack trong `package.json`, không có component tương đương trong
 * `components/ui/`). KHÔNG cài package ngoài, KHÔNG dùng animation library — chỉ CSS `transition-*`
 * (Tailwind utility) đã dùng sẵn khắp project.
 *
 * API tối giản: `useNotification()` (hook riêng, `hooks/useNotification.ts`) trả về
 * `{success, error, info}`. Danh sách thông báo là state nội bộ của Provider — KHÔNG cần thư viện
 * quản lý state ngoài. Tự động biến mất sau ~3.5s (`DISMISS_AFTER_MS`), nhiều thông báo xếp chồng
 * theo thứ tự thời gian (mảng, phần tử mới thêm vào cuối).
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (type: NotificationType, message: string) => {
      nextIdRef.current += 1;
      const id = nextIdRef.current;
      setItems((current) => [...current, { id, type, message }]);
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  // Phase 18: memo hoá — trước đây `api` là object literal mới mỗi render, khiến MỌI component gọi
  // `useNotification()` (Header, useFavorite, useRating, useComment, ChangePasswordForm,
  // HistoryListView, FavoriteListView...) re-render theo mỗi khi có toast mới/tự biến mất (audit
  // Phase 18 phát hiện — Provider bọc toàn app nên ảnh hưởng rộng). Chỉ phụ thuộc `push` (đã
  // `useCallback`), không đổi theo `items`.
  const api: NotificationApi = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  );

  return (
    <NotificationContext.Provider value={api}>
      {children}

      {/* Góc phải dưới, xếp chồng theo thứ tự nhận — dùng token màu/bo góc/đổ bóng đã có sẵn
          trong project (khớp style card/badge hiện tại), transition-opacity (Tailwind utility có
          sẵn), không thêm animation library. `max-w-[24rem]` (không dùng `max-w-sm`) — TECH-DEBT-001
          đã ghi nhận: token `--spacing-sm` tự định nghĩa trong globals.css đè lên scale `max-w-*`
          mặc định của Tailwind, khiến `max-w-sm` thực ra chỉ ra ~24px thay vì 24rem. */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-sm pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto max-w-[24rem] rounded-xl border bg-surface-container px-md py-base text-label-md font-label-md text-on-surface shadow-lg transition-opacity duration-300 ${TYPE_CLASSES[item.type]}`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
