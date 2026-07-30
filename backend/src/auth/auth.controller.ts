import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ttl tính bằng MILLISECONDS (yêu cầu của @nestjs/throttler v6) — đã xác minh bằng E2E Test
  // (Phase 6.1.1) rằng ttl:60 trước đây là cửa sổ 60ms, không phải 60 giây như dự định.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiResponse({ status: 403, description: 'Tài khoản đã bị vô hiệu hoá' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.refreshTokens(user.userId, dto.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.userId);
    return { message: 'Đăng xuất thành công' };
  }

  // ttl tính bằng MILLISECONDS — cùng lý do đã sửa ở POST /login phía trên.
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Yêu cầu đăng nhập (không @Public()) — global JwtAuthGuard áp dụng, @CurrentUser() lấy userId
  // từ chính access token, không nhận email qua body (xem ghi chú AuthService.sendVerificationEmail).
  // Cùng ttl:60_000ms (MILLISECONDS) như forgot-password — chống spam gửi email liên tục.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('send-verification-email')
  sendVerificationEmail(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.sendVerificationEmail(user.userId);
  }

  // "Gửi lại" là cùng 1 hành động với "Gửi" — xem ghi chú AuthService.sendVerificationEmail.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('resend-verification-email')
  resendVerificationEmail(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.sendVerificationEmail(user.userId);
  }

  @Public()
  @ApiResponse({ status: 409, description: 'Email đã được xác thực trước đó' })
  @ApiResponse({ status: 410, description: 'Token xác thực đã hết hạn' })
  @Get('verify-email')
  verifyEmail(@Query() query: VerifyEmailDto) {
    return this.authService.verifyEmail(query.token);
  }
}
