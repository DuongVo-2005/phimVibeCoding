import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtConfig } from '../config/configuration';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!;
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

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; token?: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      // Không tiết lộ email có tồn tại hay không
      return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.usersService.setResetPasswordToken(user.id, token, expires);

    // TODO: tích hợp gửi email thực tế (SMTP/SES). Tạm thời trả token để phục vụ test/demo.
    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi', token };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    await this.usersService.resetPassword(user.id, dto.newPassword);
    return { message: 'Đặt lại mật khẩu thành công' };
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

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
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
}
