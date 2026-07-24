import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/constants';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService.login', () => {
  let service: AuthService;
  let usersService: {
    findByEmailWithPassword: jest.Mock;
    setRefreshTokenHash: jest.Mock;
  };

  const PASSWORD = 'correct-password';
  let passwordHash: string;

  const buildUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    email: 'user@example.com',
    name: 'Nguyen Van A',
    role: UserRole.USER,
    password: passwordHash,
    isActive: true,
    ...overrides,
  });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 10);
  });

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
              accessSecret: 'test-access-secret',
              accessExpires: '15m',
              refreshSecret: 'test-refresh-secret',
              refreshExpires: '7d',
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('trả về access/refresh token khi email và mật khẩu đúng, tài khoản active', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(buildUser());

    const result = await service.login({ email: 'user@example.com', password: PASSWORD });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.email).toBe('user@example.com');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('user-1', expect.any(String));
  });

  it('ném UnauthorizedException (401) khi không tìm thấy email', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.login({ email: 'unknown@example.com', password: PASSWORD }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ném UnauthorizedException (401) khi sai mật khẩu', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(buildUser());

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ném ForbiddenException (403) khi tài khoản bị vô hiệu hoá, kèm đúng message', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(buildUser({ isActive: false }));

    let thrown: unknown;
    try {
      await service.login({ email: 'user@example.com', password: PASSWORD });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ForbiddenException);
    expect((thrown as ForbiddenException).message).toBe('Tài khoản đã bị vô hiệu hoá');
    expect((thrown as ForbiddenException).getStatus()).toBe(403);
  });

  it('vẫn trả về 401 (không phải 403) khi tài khoản bị vô hiệu hoá NHƯNG sai mật khẩu', async () => {
    // Đảm bảo không rò rỉ thông tin "tài khoản bị khoá" cho người không biết mật khẩu đúng.
    usersService.findByEmailWithPassword.mockResolvedValue(buildUser({ isActive: false }));

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
