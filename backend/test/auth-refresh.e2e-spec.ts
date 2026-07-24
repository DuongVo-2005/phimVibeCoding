import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';

// File riêng, app instance riêng, JWT_REFRESH_EXPIRES rút ngắn (2s) CHỈ trong file này — để test
// được kịch bản "refresh token hết hạn" bằng token THẬT lấy từ /auth/login (không tự chế JWT thủ
// công), không ảnh hưởng tới cấu hình 7d mặc định của các e2e spec khác.
//
// LƯU Ý QUAN TRỌNG (rút ra khi viết test này — xem Completion Report):
// 1. JWT `iat`/`exp` có độ chính xác THEO GIÂY — 2 token phát cho cùng 1 user trong cùng 1 giây
//    đồng hồ thực sẽ giống hệt nhau (cùng payload). Test rotate/refresh phải đợi >= 1 giây thực
//    giữa lần login và lần refresh đầu tiên để thấy token khác nhau — không phải bug, đặc tính
//    chuẩn của JWT theo giây.
// 2. POST /auth/login có @Throttle(limit:5, ttl:60s) thật (đã sửa đúng ở Phase 6.1.1) — file test
//    này được thiết kế để gọi login() tối đa 4 lần trong toàn bộ suite, tránh chạm ngưỡng.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Auth — POST /auth/refresh & POST /auth/logout (Phase 6.3)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  const USER = { email: 'auth-refresh-user@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_auth_refresh_e2e');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES = '4s';
    process.env.OPHIM_API_BASE_URL = 'https://ophim1.com';
    process.env.OPHIM_CRAWLER_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ParseObjectIdPipe(),
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  async function login() {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER);
    return { accessToken: res.body.data.accessToken, refreshToken: res.body.data.refreshToken };
  }

  describe('POST /auth/refresh', () => {
    it('refresh thành công -> trả về access/refresh token MỚI (khác token cũ)', async () => {
      const { refreshToken } = await login();
      await sleep(1100); // đảm bảo qua giây kế tiếp để iat khác, token mới thực sự khác token cũ

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    }, 10000);

    it('refresh token sai (chuỗi ngẫu nhiên, không phải JWT hợp lệ) -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'day-khong-phai-jwt-hop-le' });
      expect(res.status).toBe(401);
    });

    it('refresh token ký bằng secret sai (giả mạo) -> 401', async () => {
      // JWT hợp lệ về CẤU TRÚC (3 phần, base64) nhưng chữ ký sai — mô phỏng token bị giả mạo, KHÔNG
      // phải tự chế token để đóng vai người dùng thật (không dùng để bypass auth cho API khác).
      const forged =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIn0.YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo';
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: forged });
      expect(res.status).toBe(401);
    });

    it('rotate: token cũ không dùng lại được sau khi refresh, token MỚI vẫn dùng bình thường', async () => {
      const { refreshToken: oldToken } = await login();
      await sleep(1100);

      const first = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldToken });
      expect(first.status).toBe(201);
      const newToken = first.body.data.refreshToken;

      // Token CŨ giờ phải bị từ chối — đã bị ghi đè hash trong DB.
      const reuseOld = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldToken });
      expect(reuseOld.status).toBe(401);

      // Token MỚI (vừa nhận được từ rotate) phải dùng được bình thường.
      await sleep(1100);
      const second = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: newToken });
      expect(second.status).toBe(201);
    }, 10000);

    it('refresh token hết hạn (đợi qua JWT_REFRESH_EXPIRES=4s) -> 401', async () => {
      const { refreshToken } = await login();

      await sleep(4500);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(401);
    }, 15000);

    it('không có refreshToken trong body -> 401 (AuthGuard(jwt-refresh) trích token từ body TRONG guard, chạy trước ValidationPipe nên guard chặn trước — không phải 400 DTO validation)', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('không có access token -> 401', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/logout');
      expect(res.status).toBe(401);
    });

    it('logout thành công -> refresh token trước đó bị revoke; gọi logout lại lần nữa vẫn không lỗi (idempotent)', async () => {
      const { accessToken, refreshToken } = await login();

      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(logoutRes.status).toBe(201);

      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(refreshAfterLogout.status).toBe(401);

      // access token vẫn còn hạn (JWT access không bị revoke khi logout, chỉ refresh token bị) —
      // gọi logout lần 2 với cùng access token đó vẫn phải thành công, không lỗi.
      const secondLogout = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(secondLogout.status).toBe(201);
    });
  });
});
