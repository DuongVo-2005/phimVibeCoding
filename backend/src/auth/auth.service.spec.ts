import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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

describe('AuthService.register — kiểm tra password hash có lộ trong response hay không (Phase 6.3)', () => {
  let service: AuthService;
  let usersService: { create: jest.Mock; setRefreshTokenHash: jest.Mock };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
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

  it('response của register() KHÔNG chứa password, kể cả khi UsersService.create() trả về document còn field password trong memory (mô phỏng đúng rủi ro select:false không áp dụng cho document vừa .save())', async () => {
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'A',
      role: UserRole.USER,
      password: '$2b$10$giaLapHashKhongDuocLoRa', // mô phỏng field password vẫn còn trong document
    });

    const result = await service.register({ email: 'user@example.com', password: 'Password123' });

    expect(result).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('password');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'A',
      role: UserRole.USER,
    });
  });
});

describe('AuthService.forgotPassword — bảo mật (Phase 6.1): không trả reset token cho client', () => {
  let service: AuthService;
  let usersService: {
    findByEmailWithPassword: jest.Mock;
    setResetPasswordToken: jest.Mock;
  };
  let configGetMock: jest.Mock;

  const buildConfig = (nodeEnv: string) =>
    jest.fn((key: string) => {
      if (key === 'jwt') {
        return {
          accessSecret: 'test-access-secret',
          accessExpires: '15m',
          refreshSecret: 'test-refresh-secret',
          refreshExpires: '7d',
        };
      }
      if (key === 'app') {
        return { nodeEnv, port: 3000, apiPrefix: 'api/v1', corsOrigin: '*' };
      }
      return undefined;
    });

  const setup = async (nodeEnv: string) => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      setResetPasswordToken: jest.fn().mockResolvedValue(undefined),
    };
    configGetMock = buildConfig(nodeEnv);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        JwtService,
        { provide: ConfigService, useValue: { get: configGetMock } },
      ],
    }).compile();

    service = module.get(AuthService);
  };

  it('response KHÔNG chứa field token, kể cả khi email tồn tại', async () => {
    await setup('development');
    usersService.findByEmailWithPassword.mockResolvedValue({ id: 'user-1' });

    const result = await service.forgotPassword({ email: 'user@example.com' });

    expect(result).not.toHaveProperty('token');
    expect(Object.keys(result)).toEqual(['message']);
  });

  it('vẫn gọi setResetPasswordToken để lưu token ở server (chỉ không trả về client)', async () => {
    await setup('development');
    usersService.findByEmailWithPassword.mockResolvedValue({ id: 'user-1' });

    await service.forgotPassword({ email: 'user@example.com' });

    expect(usersService.setResetPasswordToken).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      expect.any(Date),
    );
  });

  it('email không tồn tại -> vẫn trả message chung, không tiết lộ, không gọi setResetPasswordToken', async () => {
    await setup('development');
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    const result = await service.forgotPassword({ email: 'khong-ton-tai@example.com' });

    expect(result).not.toHaveProperty('token');
    expect(usersService.setResetPasswordToken).not.toHaveBeenCalled();
  });
});

describe('AuthService.refreshTokens / logout (Phase 6.3)', () => {
  let service: AuthService;
  let usersService: {
    findByIdWithRefreshToken: jest.Mock;
    setRefreshTokenHash: jest.Mock;
  };

  const OLD_REFRESH_TOKEN = 'old-refresh-token-value';
  let oldRefreshTokenHash: string;

  // AuthService băm refresh token bằng SHA-256 trước khi đưa vào bcrypt (xem
  // AuthService['hashRefreshTokenForBcrypt']) — fixture ở đây phải mô phỏng đúng pipeline đó,
  // nếu không mock sẽ không khớp với cách service thực sự so khớp token.
  const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

  beforeAll(async () => {
    oldRefreshTokenHash = await bcrypt.hash(sha256(OLD_REFRESH_TOKEN), 10);
  });

  beforeEach(async () => {
    usersService = {
      findByIdWithRefreshToken: jest.fn(),
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

  describe('refreshTokens', () => {
    it('refresh token đúng -> trả về access/refresh token MỚI, rotate hash trong DB', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'A',
        role: UserRole.USER,
        refreshTokenHash: oldRefreshTokenHash,
      });

      const result = await service.refreshTokens('user-1', OLD_REFRESH_TOKEN);

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe(OLD_REFRESH_TOKEN);
      // Rotate: hash mới được lưu lại, không phải hash cũ.
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
      );
      const newHash = usersService.setRefreshTokenHash.mock.calls[0][1];
      expect(newHash).not.toBe(oldRefreshTokenHash);
    });

    it('ném UnauthorizedException khi refresh token sai (không khớp hash đã lưu)', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue({
        id: 'user-1',
        refreshTokenHash: oldRefreshTokenHash,
      });

      await expect(
        service.refreshTokens('user-1', 'token-gia-mao-khong-khop'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.setRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('ném UnauthorizedException khi user không tồn tại', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue(null);

      await expect(service.refreshTokens('user-khong-ton-tai', OLD_REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('ném UnauthorizedException khi user tồn tại nhưng chưa từng có refreshTokenHash (vd. đã logout)', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue({
        id: 'user-1',
        refreshTokenHash: null,
      });

      await expect(service.refreshTokens('user-1', OLD_REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refresh token cũ không dùng lại được sau khi đã rotate (gọi refresh 2 lần liên tiếp)', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'A',
        role: UserRole.USER,
        refreshTokenHash: oldRefreshTokenHash,
      });

      const first = await service.refreshTokens('user-1', OLD_REFRESH_TOKEN);
      const newHash = usersService.setRefreshTokenHash.mock.calls[0][1];

      // Lần gọi thứ 2: DB giờ đã có hash MỚI (mô phỏng bằng cách trả về newHash thay vì
      // oldRefreshTokenHash) — refresh token CŨ giờ phải bị từ chối.
      usersService.findByIdWithRefreshToken.mockResolvedValueOnce({
        id: 'user-1',
        refreshTokenHash: newHash,
      });

      await expect(service.refreshTokens('user-1', OLD_REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(first.refreshToken).not.toBe(OLD_REFRESH_TOKEN);
    });

    it('regression (bug bcrypt cắt 72 byte): 2 token khác nhau nhưng chung >72 byte đầu (như 2 JWT của cùng user, chỉ khác iat/exp/signature ở cuối) -> token B KHÔNG được chấp nhận khi hash lưu là của token A', async () => {
      // Mô phỏng đúng đặc điểm gây ra bug thật: 2 refresh token JWT của CÙNG 1 user luôn có
      // header + phần đầu payload (sub/email/role) giống hệt nhau, dài hơn 72 byte — chỉ khác
      // nhau ở iat/exp/signature nằm SAU byte thứ 72. Dùng string thuần, không phụ thuộc thời
      // gian ký JWT thực (tránh test bị "may rủi" nếu 2 lần ký JWT rơi cùng 1 giây).
      const commonPrefix72Bytes = 'x'.repeat(100);
      const tokenA = `${commonPrefix72Bytes}.iat-1700000000.signature-AAA`;
      const tokenB = `${commonPrefix72Bytes}.iat-1700000001.signature-BBB`;
      expect(tokenA).not.toBe(tokenB);
      expect(tokenA.slice(0, 72)).toBe(tokenB.slice(0, 72));

      const hashOfTokenA = await bcrypt.hash(sha256(tokenA), 10);
      usersService.findByIdWithRefreshToken.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'A',
        role: UserRole.USER,
        refreshTokenHash: hashOfTokenA,
      });

      await expect(service.refreshTokens('user-1', tokenB)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('xoá refreshTokenHash (set null) — refresh token bị revoke', async () => {
      await service.logout('user-1');

      expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
    });

    it('gọi logout nhiều lần liên tiếp vẫn không lỗi (idempotent)', async () => {
      await expect(service.logout('user-1')).resolves.toBeUndefined();
      await expect(service.logout('user-1')).resolves.toBeUndefined();
      expect(usersService.setRefreshTokenHash).toHaveBeenCalledTimes(2);
    });
  });
});
