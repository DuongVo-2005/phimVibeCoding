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

describe('Ratings (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let userAToken: string;
  let userBToken: string;
  let filmId: string;

  const USER_A = { email: 'ratings-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'ratings-user-b@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_ratings_e2e');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
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

    filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));

    const film = await filmModel.create({ slug: 'phim-danh-gia', title: 'Phim Đánh Giá' });
    filmId = film._id.toString();

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER_A);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER_B);

    const loginA = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER_A);
    userAToken = loginA.body.data.accessToken;
    const loginB = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER_B);
    userBToken = loginB.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Auth guard — chỉ dùng JWT hiện có, không Roles/Permission', () => {
    it('GET /ratings/film/:filmId là route Public, không cần token', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ average: 0, count: 0 });
    });

    it('GET /ratings/film/:filmId/me không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}/me`);
      expect(res.status).toBe(401);
    });

    it('POST /ratings/:filmId không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .send({ score: 8 });
      expect(res.status).toBe(401);
    });

    it('DELETE /ratings/:filmId không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).delete(`/api/v1/ratings/${filmId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('score = 0 (ngoài khoảng 1-10) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ score: 0 });
      expect(res.status).toBe(400);
    });

    it('score = 11 (ngoài khoảng 1-10) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ score: 11 });
      expect(res.status).toBe(400);
    });

    it('score không phải số nguyên -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ score: 7.5 });
      expect(res.status).toBe(400);
    });
  });

  describe('Upsert + tự động tính lại rating trung bình của phim', () => {
    it('POST /ratings/:filmId (User A, score=8) tạo đánh giá mới', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ score: 8 });

      expect(res.status).toBe(201);
      expect(res.body.data.score).toBe(8);

      const summary = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}`);
      expect(summary.body.data).toEqual({ average: 8, count: 1 });

      const film = await filmModel.findById(filmId).exec();
      expect(film?.ratingAvg).toBe(8);
      expect(film?.ratingCount).toBe(1);
    });

    it('GET /ratings/film/:filmId/me (User A) trả về đúng rating của mình', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ratings/film/${filmId}/me`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(8);
    });

    it('GET /ratings/film/:filmId/me (User B, chưa đánh giá) trả về null', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ratings/film/${filmId}/me`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('POST /ratings/:filmId (User A rate lại, score=4) ghi đè điểm cũ — vẫn chỉ 1 rating', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ score: 4 });

      expect(res.status).toBe(201);
      expect(res.body.data.score).toBe(4);

      const summary = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}`);
      expect(summary.body.data).toEqual({ average: 4, count: 1 });
    });

    it('POST /ratings/:filmId (User B, score=10) — 2 rating độc lập, trung bình cập nhật đúng', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ score: 10 });

      expect(res.status).toBe(201);

      const summary = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}`);
      expect(summary.body.data).toEqual({ average: 7, count: 2 });

      const film = await filmModel.findById(filmId).exec();
      expect(film?.ratingAvg).toBe(7);
      expect(film?.ratingCount).toBe(2);
    });

    it('DELETE /ratings/:filmId (User A) chỉ xoá rating của A, không đụng tới rating của B', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/ratings/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);

      const meA = await request(app.getHttpServer())
        .get(`/api/v1/ratings/film/${filmId}/me`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(meA.body.data).toBeNull();

      const meB = await request(app.getHttpServer())
        .get(`/api/v1/ratings/film/${filmId}/me`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(meB.body.data.score).toBe(10);

      const summary = await request(app.getHttpServer()).get(`/api/v1/ratings/film/${filmId}`);
      expect(summary.body.data).toEqual({ average: 10, count: 1 });
    });
  });
});
