import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { decodeJwtExpiry } from '@/lib/auth/decode-jwt-expiry';

// D1/D2 (Phase 7): cookie-based session qua NextAuth Credentials Provider, cho phép custom
// callback để tương thích với refresh-token rotation của backend (auth.service.ts.refreshTokens
// — mỗi lần refresh backend phát cặp token MỚI và thu hồi refresh token cũ).
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const tokens = await authApi.login(credentials.email, credentials.password);

          return {
            id: tokens.user.id,
            email: tokens.user.email,
            name: tokens.user.name,
            role: tokens.user.role,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          };
        } catch (error) {
          // Error mapping cơ bản — phân biệt đúng 2 nguyên nhân thật của backend
          // (auth.service.ts): 401 sai email/mật khẩu vs 403 tài khoản bị vô hiệu hoá.
          if (error instanceof ApiRequestError) {
            throw new Error(
              error.statusCode === 403 ? 'ACCOUNT_DEACTIVATED' : 'INVALID_CREDENTIALS',
            );
          }
          throw new Error('UNKNOWN_ERROR');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Lần đăng nhập đầu tiên — `user` là object authorize() vừa trả về.
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = decodeJwtExpiry(user.accessToken) ?? Date.now();
        token.user = {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? '',
          role: user.role,
        };
        return token;
      }

      if (typeof token.accessTokenExpires === 'number' && Date.now() < token.accessTokenExpires) {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: 'RefreshTokenError' };
      }

      try {
        const refreshed = await authApi.refresh(token.refreshToken);
        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accessTokenExpires: decodeJwtExpiry(refreshed.accessToken) ?? Date.now(),
          error: undefined,
        };
      } catch {
        return { ...token, error: 'RefreshTokenError' };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
