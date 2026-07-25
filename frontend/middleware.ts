import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection nền tảng (Phase 9.1): chỉ kiểm tra CÓ session hợp lệ hay không, và với
 * `/admin/**` kiểm tra thêm role thô (`user.role === 'admin'`) lấy từ JWT callback.
 *
 * Chưa gate theo permission key chi tiết (films:update, comments:moderate...) — theo phát hiện
 * ở Frontend Planning (mục 19): backend hiện chưa expose permission set đã resolve cho chính
 * client đang đăng nhập (AuthTokens/GET /users/me chỉ có `role` enum thô), nên FE chưa có căn cứ
 * để gate chi tiết hơn mức này.
 */
const USER_AREA_PREFIX = '/user';
const ADMIN_AREA_PREFIX = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isUserArea = pathname.startsWith(USER_AREA_PREFIX);
  const isAdminArea = pathname.startsWith(ADMIN_AREA_PREFIX);

  if (!isUserArea && !isAdminArea) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminArea && token.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*'],
};
