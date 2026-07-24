import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';

// File riêng, app instance riêng (cùng lý do đã áp dụng ở test/throttle.e2e-spec.ts — Phase 6.1):
// ThrottlerGuard đếm theo IP+route cho suốt vòng đời app instance, tách file để không phụ thuộc/
// nhiễu số lượng request của các e2e spec khác chạm cùng route (POST /auth/login,
// POST /auth/forgot-password).
//
// Phase 6.1.1: đã xác minh bằng chạy thực tế (xem Completion Report) rằng ttl:60 trên
// auth.controller.ts bị hiểu là 60 MILLISECONDS thay vì 60 giây — cùng nguyên nhân đã sửa cho
// comments:create/film-reports:create ở Phase 6.1. Test dưới đây khẳng định hành vi ĐÚNG
// (ttl tính bằng giây, cửa sổ 60s thật) sau khi sửa — trước khi sửa, test "POST /auth/login"
// sẽ FAIL (6 request liên tiếp không có cái nào bị 429, vì bcrypt.compare khiến mỗi request mất
// ~70-100ms, vượt luôn cửa sổ 60ms cũ trước khi request sau kịp tới).
describe('Auth throttle — xác minh đơn vị ttl thực tế (Phase 6.1.1)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  const USER = { email: 'auth-throttle-user@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_auth_throttle_e2e');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.OPHIM_API_BASE_URL = 'https://ophim1.com';
    process.env.OPHIM_CRAWLER_ENABLED = 'false';
    process.env.THROTTLE_TTL = '60';
    process.env.THROTTLE_LIMIT = '100';

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

  it('POST /auth/login bị chặn 429 sau khi vượt quá 5 request/60s, kể cả khi mỗi request chậm (bcrypt)', async () => {
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: USER.email, password: 'sai-mat-khau' });
      results.push(res.status);
    }

    const throttledCount = results.filter((status) => status === 429).length;
    expect(throttledCount).toBeGreaterThanOrEqual(1);
    expect(results[5]).toBe(429);
  }, 30000);

  it('POST /auth/forgot-password bị chặn 429 sau khi vượt quá 3 request/60s', async () => {
    const results: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: USER.email });
      results.push(res.status);
    }

    const throttledCount = results.filter((status) => status === 429).length;
    expect(throttledCount).toBeGreaterThanOrEqual(1);
    expect(results[3]).toBe(429);
  }, 30000);
});
