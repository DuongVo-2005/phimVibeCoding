/**
 * Mở rộng type mặc định của NextAuth để khớp đúng dữ liệu thật backend trả về
 * (AuthTokens — backend/src/auth/interfaces/auth-tokens.interface.ts).
 */
import type { AuthUser } from '@/lib/api/types';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: 'RefreshTokenError';
    user?: AuthUser;
  }

  interface User extends AuthUser {
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: 'RefreshTokenError';
    user?: AuthUser;
  }
}
