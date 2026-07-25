'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

// Chỉ wiring SessionProvider của NextAuth (D1/D2, Phase 7) — chưa có logic đăng nhập/đăng ký,
// chưa gọi backend.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
