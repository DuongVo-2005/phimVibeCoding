import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AppConfig, JwtConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Payload token xác thực email — CHỈ 2 field, không có `role` (khác `JwtPayload` của access/
 * refresh) vì token này chỉ dùng cho ĐÚNG 1 hành động (xác thực email), không phải bearer credential
 * chung cho mọi API. */
interface EmailVerificationPayload {
  sub: string;
  email: string;
}

const GENERIC_INVALID_TOKEN_MESSAGE = 'Token xác thực không hợp lệ';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: JwtConfig;
  private readonly appConfig: AppConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!;
    this.appConfig = this.configService.get<AppConfig>('app')!;
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hoá');
    }

    return this.issueTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const isMatch = await bcrypt.compare(
      this.hashRefreshTokenForBcrypt(refreshToken),
      user.refreshTokenHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      // Không tiết lộ email có tồn tại hay không
      return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.usersService.setResetPasswordToken(user.id, token, expires);

    // TODO: tích hợp gửi email thực tế (SMTP/SES) khi hệ thống có SMTP.
    // Bảo mật (Phase 6.1): reset token KHÔNG được trả về client — trả thẳng trong response cho
    // phép bất kỳ ai biết email nạn nhân tự chiếm quyền tài khoản mà không cần truy cập hộp thư.
    // Ở development (chưa có SMTP thật), chỉ log nội bộ để có thể test thủ công, không lọt ra API.
    if (this.appConfig.nodeEnv !== 'production') {
      this.logger.debug(`[dev-only] Reset password token cho ${dto.email}: ${token}`);
    }

    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    await this.usersService.resetPassword(user.id, dto.newPassword);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  /**
   * Phase 33 (Verify Email) — `POST /auth/send-verification-email` VÀ `POST /auth/resend-
   * verification-email` đều gọi hàm này (2 route, cùng 1 hành động — gửi lại đơn giản là gửi lại,
   * không có logic khác biệt nào để tách riêng, tránh trùng lặp code cho 2 endpoint giống hệt
   * nhau). Yêu cầu đăng nhập — `userId` lấy từ access token đã xác thực (`@CurrentUser()` ở
   * controller), KHÔNG nhận email qua body (khác `forgotPassword` — endpoint này luôn gửi cho
   * đúng chủ tài khoản đang đăng nhập, không có chỗ cho việc gửi hộ/gửi nhầm người khác).
   *
   * Token là JWT KÝ RIÊNG (`emailVerificationSecret`, KHÔNG lưu DB) — thuần "signed token", xác
   * thực chỉ bằng chữ ký + `exp` (không có bảng token nào để tra). Chống replay: xem `verifyEmail()`
   * bên dưới — sau khi xác thực thành công, `isEmailVerified=true` khiến MỌI lần dùng lại token cũ
   * (dù chữ ký/hạn vẫn hợp lệ) đều bị từ chối ở bước kiểm tra trạng thái, không phải vì token đã
   * "dùng rồi" theo nghĩa sổ sách — đây là thiết kế có chủ đích (token thứ 2 gửi từ nút "Gửi lại"
   * trong lúc token thứ 1 chưa hết hạn vẫn nên hoạt động — người dùng có thể có nhiều email chưa đọc
   * trong hộp thư, không có lý do bảo mật để làm token cũ hơn mất hiệu lực khi gửi lại).
   */
  async sendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneOrThrow(userId);
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hoá');
    }
    if (user.isEmailVerified) {
      return { message: 'Email đã được xác thực trước đó' };
    }

    const payload: EmailVerificationPayload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, {
      secret: this.jwtConfig.emailVerificationSecret,
      expiresIn: this.jwtConfig.emailVerificationExpires,
    });

    const verifyUrl = `${this.appConfig.frontendUrl}/xac-thuc-email?token=${token}`;
    await this.mailService.send({
      to: user.email,
      subject: 'Xác thực địa chỉ email của bạn — RoPhim',
      html: `<p>Nhấp vào đường dẫn sau để xác thực email của bạn (hết hạn sau ${this.jwtConfig.emailVerificationExpires}):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: `Nhấp vào đường dẫn sau để xác thực email của bạn (hết hạn sau ${this.jwtConfig.emailVerificationExpires}): ${verifyUrl}`,
    });

    if (!this.mailService.isConfigured) {
      this.mailService.logDevToken('Email verification token', user.email, token);
    }

    return { message: 'Email xác thực đã được gửi' };
  }

  /**
   * `GET /auth/verify-email?token=` — Public (token TỰ chứng minh danh tính, giống cơ chế
   * `resetPassword`). Trả về HTTP status KHÁC NHAU cho từng trường hợp thay vì gộp chung 1 message
   * — frontend cần phân biệt 4 trạng thái UI (Success/Invalid/Expired/Already verified, yêu cầu
   * Phase 33) mà không nên tự suy đoán từ nội dung message tiếng Việt (dễ vỡ khi đổi câu chữ):
   *   200 OK              — thành công
   *   400 Bad Request      — token sai chữ ký/hỏng, hoặc user không còn tồn tại/đã bị vô hiệu hoá
   *                          (KHÔNG phân biệt 2 lý do này trong message — "no sensitive information
   *                          in responses", tránh lộ ai còn tồn tại trong hệ thống)
   *   409 Conflict          — email đã xác thực trước đó (replay sau khi đã thành công 1 lần)
   *   410 Gone              — token đã hết hạn
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload: EmailVerificationPayload;
    try {
      payload = this.jwtService.verify<EmailVerificationPayload>(token, {
        secret: this.jwtConfig.emailVerificationSecret,
      });
    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        throw new GoneException('Token xác thực đã hết hạn');
      }
      throw new BadRequestException(GENERIC_INVALID_TOKEN_MESSAGE);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive || user.email !== payload.email) {
      throw new BadRequestException(GENERIC_INVALID_TOKEN_MESSAGE);
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email đã được xác thực trước đó');
    }

    await this.usersService.markEmailVerified(user.id);
    return { message: 'Xác thực email thành công' };
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfig.accessSecret,
      expiresIn: this.jwtConfig.accessExpires,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshExpires,
    });

    const refreshTokenHash = await bcrypt.hash(this.hashRefreshTokenForBcrypt(refreshToken), 10);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // bcrypt chỉ đọc 72 byte đầu của input, trong khi mọi refresh token JWT phát cho cùng 1 user
  // có ~150+ byte đầu giống hệt nhau (header + phần payload trước iat/exp) — băm trước bằng
  // SHA-256 để bcrypt luôn nhận input có độ dài cố định, đảm bảo phân biệt đúng các token khác nhau.
  private hashRefreshTokenForBcrypt(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }
}
