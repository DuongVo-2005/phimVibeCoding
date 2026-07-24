import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Xác thực JWT nếu request có gửi Bearer token hợp lệ (gán `request.user`), nhưng KHÔNG BAO GIỜ
 * chặn request nếu thiếu/token không hợp lệ — khác với JwtAuthGuard mặc định (luôn 401 khi thiếu
 * token, trừ khi route có @Public()). Dùng cho route vừa @Public() vừa cần biết "caller có phải
 * admin đã đăng nhập hay không" để quyết định business logic (vd. GET /films?isPublished=...).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
