'use client';

import { useContext } from 'react';
import {
  NotificationContext,
  type NotificationApi,
} from '@/components/providers/notification-provider';

/**
 * useNotification — Phase 15A: hook đọc `NotificationContext` (`NotificationProvider` đặt ở App
 * Root, xem `components/providers/index.tsx`). Throw rõ ràng nếu gọi ngoài Provider — lỗi lập
 * trình cần phát hiện sớm, không phải trạng thái hợp lệ để âm thầm bỏ qua.
 */
export function useNotification(): NotificationApi {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification() phải được gọi bên trong <NotificationProvider>.');
  }
  return context;
}
