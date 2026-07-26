import { NotificationProvider } from './notification-provider';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';

// Providers.tsx — chỉ ghép các provider hạ tầng lại với nhau (wiring), không có business logic.
// ThemeProvider: không tạo — frontend.md không yêu cầu theme/dark-mode nào, "không đủ căn cứ".
// Phase 15A: thêm NotificationProvider (đặt ở App Root theo đúng yêu cầu) — notification layer
// chuẩn của project, không phải giải pháp tạm.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
