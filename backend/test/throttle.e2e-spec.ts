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
import { Film, FilmDocument } from '../src/films/schemas/film.schema';

// File riêng, app instance riêng (Phase 6.1) — throttle được ThrottlerGuard đếm theo IP+route cho
// suốt vòng đời app instance, nên tách file để không phụ thuộc/nhiễu số lượng request của các
// e2e spec khác chạm cùng route (POST /comments, POST /film-reports).
describe('Rate limiting — comments:create / film-reports:create (Phase 6.1)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let userToken: string;
  let filmId: string;

  const USER = { email: 'throttle-user@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_throttle_e2e');
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

    filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));
    const film = await filmModel.create({ slug: 'phim-throttle', title: 'Phim Throttle' });
    filmId = film._id.toString();

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER);
    userToken = login.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('POST /comments bị chặn 429 sau khi vượt quá 10 request/60s (@Throttle riêng, không dùng default 100/60s)', async () => {
    const results: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ film: filmId, content: `Bình luận thứ ${i}` });
      results.push(res.status);
    }

    const successCount = results.filter((status) => status === 201).length;
    const throttledCount = results.filter((status) => status === 429).length;

    expect(successCount).toBe(10);
    expect(throttledCount).toBeGreaterThanOrEqual(1);
    expect(results[10]).toBe(429);
  }, 30000);

  it('POST /film-reports bị chặn 429 sau khi vượt quá 5 request/60s (@Throttle riêng, không dùng default 100/60s)', async () => {
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .send({ film: filmId, reason: `Báo lỗi lần ${i}` });
      results.push(res.status);
    }

    const successCount = results.filter((status) => status === 201).length;
    const throttledCount = results.filter((status) => status === 429).length;

    expect(successCount).toBe(5);
    expect(throttledCount).toBeGreaterThanOrEqual(1);
    expect(results[5]).toBe(429);
  }, 30000);
});
