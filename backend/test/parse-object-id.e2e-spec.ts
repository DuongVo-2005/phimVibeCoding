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

describe('ParseObjectIdPipe (e2e) — chặn CastError -> 500, trả 400 cho id sai format', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_parse_object_id_e2e');
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
    await filmModel.create({ slug: 'phim-test-object-id', title: 'Phim Test' });
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('id sai format trên route Public -> 400 rõ ràng (không phải 500)', () => {
    it('GET /comments/:id/replies — id không phải hex 24 ký tự -> 400', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/comments/khong-hop-le/replies',
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /ratings/film/:filmId — filmId thiếu ký tự so với 24-hex -> 400', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/ratings/film/65f1a2b3c4');
      expect(res.status).toBe(400);
    });

    it('id hợp lệ (24-hex) nhưng không tồn tại -> KHÔNG phải 400 (pipe chỉ check format, không check tồn tại)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/comments/65f1a2b3c4d5e6f7a8b9c0d1/replies',
      );
      expect(res.status).not.toBe(400);
      expect(res.status).toBe(200); // route replies không 404 khi rỗng, chỉ trả danh sách rỗng
    });
  });

  describe('id sai format trên route cần auth — không bao giờ là 500, kể cả khi bị JwtAuthGuard chặn trước bằng 401', () => {
    it('GET /crawler-history/:id không có token -> 401 (guard chạy trước pipe), không phải 500', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/crawler-history/khong-hop-le');
      expect(res.status).not.toBe(500);
    });

    it('DELETE /favorites/:targetType/:targetId không có token -> 401, không phải 500', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/api/v1/favorites/film/khong-phai-object-id',
      );
      expect(res.status).not.toBe(500);
    });
  });

  describe('route dùng :slug vẫn hoạt động bình thường (không bị pipe chặn nhầm)', () => {
    it('GET /films/:slug với slug chuỗi thường -> 200, không bị coi là ObjectId sai format', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/films/phim-test-object-id');
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Phim Test');
    });

    it('GET /films/:slug với slug không tồn tại -> 404 (không phải 400 do pipe)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/films/khong-ton-tai-slug');
      expect(res.status).toBe(404);
    });
  });
});
