import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';

// Providers.tsx — chỉ ghép các provider hạ tầng lại với nhau (wiring), không có business logic.
// ThemeProvider: không tạo — frontend.md không yêu cầu theme/dark-mode nào, "không đủ căn cứ".
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
