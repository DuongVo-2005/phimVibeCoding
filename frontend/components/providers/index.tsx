import { NotificationProvider } from './notification-provider';
import { QueryProvider } from './query-provider';
import { SessionErrorWatcher } from './session-error-watcher';
import { SessionProvider } from './session-provider';

// Providers.tsx — chỉ ghép các provider hạ tầng lại với nhau (wiring), không có business logic.
// ThemeProvider: không tạo — frontend.md không yêu cầu theme/dark-mode nào, "không đủ căn cứ".
// Phase 15A: thêm NotificationProvider (đặt ở App Root theo đúng yêu cầu) — notification layer
// chuẩn của project, không phải giải pháp tạm.
// Phase 17A: thêm SessionErrorWatcher — cần nằm trong SessionProvider (đọc session) để bắt
// `RefreshTokenError` bất kể đang ở route nào, không tự render gì (return null).
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NotificationProvider>
          <SessionErrorWatcher />
          {children}
        </NotificationProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
