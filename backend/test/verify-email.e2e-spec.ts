import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';
import { MailService } from '../src/mail/mail.service';
import { User, UserDocument } from '../src/users/schemas/user.schema';

/** Trích token từ nội dung email đã "gửi" (`MailService` bị override bằng mock bên dưới — test e2e
 * thật không có SMTP thật, cùng lý do `AuthService` không bao giờ trả token qua response). */
function extractTokenFromMailText(text: string): string {
  const match = text.match(/token=([^\s&]+)/);
  if (!match) throw new Error(`Không tìm thấy token trong nội dung mail: ${text}`);
  return match[1];
}

describe('Verify Email (e2e) — Phase 33', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let mailServiceMock: { send: jest.Mock; logDevToken: jest.Mock; isConfigured: boolean };

  const USER = {
    email: 'phase33-verify@example.com',
    password: 'Password123',
    name: 'Phase33 User',
  };

  let accessToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_e2e_verify_email');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.JWT_EMAIL_VERIFICATION_SECRET = 'e2e-email-verification-secret';
    process.env.JWT_EMAIL_VERIFICATION_EXPIRES = '24h';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    process.env.OPHIM_API_BASE_URL = 'https://ophim1.com';
    process.env.OPHIM_CRAWLER_ENABLED = 'false';

    mailServiceMock = {
      send: jest.fn().mockResolvedValue(undefined),
      logDevToken: jest.fn(),
      isConfigured: false,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ParseObjectIdPipe(),
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const registerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    accessToken = registerRes.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  afterEach(() => {
    mailServiceMock.send.mockClear();
    mailServiceMock.logDevToken.mockClear();
  });

  it('GET /api/v1/users/me — isEmailVerified=false, emailVerifiedAt=null ngay sau khi đăng ký', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isEmailVerified).toBe(false);
    expect(res.body.data.emailVerifiedAt).toBeNull();
  });

  it('POST /api/v1/auth/resend-verification-email không kèm token -> 401 (yêu cầu đăng nhập)', async () => {
    // Dùng route resend (không phải send) để không tốn 1 lượt trong throttle limit:3 của
    // send-verification-email — cả spec này chia sẻ chung 1 app instance/IP nên throttle 2 route
    // tính riêng theo tên handler (xem `@Throttle` ở auth.controller.ts), tách ra để test dưới
    // không bị 429 "giả" do chính test suite gọi dồn.
    const res = await request(app.getHttpServer()).post('/api/v1/auth/resend-verification-email');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/verify-email?token=khong-hop-le -> 400, message không tiết lộ chi tiết', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/auth/verify-email?token=khong-hop-le',
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Token xác thực không hợp lệ');
  });

  it('luồng đầy đủ: POST send-verification-email -> gửi mail chứa link -> GET verify-email?token= -> 200 -> user.isEmailVerified=true', async () => {
    const sendRes = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-email')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.success).toBe(true);
    expect(mailServiceMock.send).toHaveBeenCalledTimes(1);
    expect(mailServiceMock.logDevToken).toHaveBeenCalledTimes(1);

    const mailArg = mailServiceMock.send.mock.calls[0][0];
    expect(mailArg.to).toBe(USER.email);
    const token = extractTokenFromMailText(mailArg.text);

    const verifyRes = await request(app.getHttpServer()).get(
      `/api/v1/auth/verify-email?token=${token}`,
    );
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    const userDoc = await userModel.findOne({ email: USER.email }).exec();
    expect(userDoc?.isEmailVerified).toBe(true);
    expect(userDoc?.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('POST /api/v1/auth/resend-verification-email cho tài khoản ĐÃ xác thực (test trước) -> KHÔNG gửi mail, trả message riêng (không phải lỗi)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification-email')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.message).toContain('đã được xác thực');
    expect(mailServiceMock.send).not.toHaveBeenCalled();
  });

  it('GET /api/v1/auth/verify-email với token đã ký cho tài khoản đã xác thực -> 409 Conflict (replay bị chặn)', async () => {
    // Ký 1 token verify-email MỚI thủ công (giả lập link cũ vẫn còn hạn) cho user đã verified.
    const jwtModule = await import('@nestjs/jwt');
    const rawJwt = new jwtModule.JwtService();
    const user = await userModel.findOne({ email: USER.email }).exec();
    const replayToken = rawJwt.sign(
      { sub: user!.id, email: USER.email },
      { secret: 'e2e-email-verification-secret', expiresIn: '24h' },
    );

    const res = await request(app.getHttpServer()).get(
      `/api/v1/auth/verify-email?token=${replayToken}`,
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email đã được xác thực trước đó');
  });

  it('token hết hạn -> 410 Gone', async () => {
    const jwtModule = await import('@nestjs/jwt');
    const rawJwt = new jwtModule.JwtService();
    const user = await userModel.findOne({ email: USER.email }).exec();
    const expiredToken = rawJwt.sign(
      { sub: user!.id, email: USER.email },
      { secret: 'e2e-email-verification-secret', expiresIn: -10 },
    );

    const res = await request(app.getHttpServer()).get(
      `/api/v1/auth/verify-email?token=${expiredToken}`,
    );

    expect(res.status).toBe(410);
    expect(res.body.message).toBe('Token xác thực đã hết hạn');
  });

  it('tài khoản bị vô hiệu hoá -> verify-email từ chối (400), send-verification-email cũng từ chối (403)', async () => {
    const disabledUser = {
      email: 'phase33-disabled@example.com',
      password: 'Password123',
      name: 'Disabled User',
    };
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(disabledUser);
    const disabledAccessToken = registerRes.body.data.accessToken;

    const sendBeforeDisable = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-email')
      .set('Authorization', `Bearer ${disabledAccessToken}`);
    expect(sendBeforeDisable.status).toBe(201);
    const mailArg = mailServiceMock.send.mock.calls[mailServiceMock.send.mock.calls.length - 1][0];
    const token = extractTokenFromMailText(mailArg.text);

    await userModel.updateOne({ email: disabledUser.email }, { isActive: false }).exec();

    const verifyRes = await request(app.getHttpServer()).get(
      `/api/v1/auth/verify-email?token=${token}`,
    );
    expect(verifyRes.status).toBe(400);

    const sendAfterDisable = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-email')
      .set('Authorization', `Bearer ${disabledAccessToken}`);
    expect(sendAfterDisable.status).toBe(403);

    await userModel.updateOne({ email: disabledUser.email }, { isActive: true }).exec();
  });
});
