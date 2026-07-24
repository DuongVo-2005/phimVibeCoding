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
import { History, HistoryDocument } from '../src/histories/schemas/history.schema';

describe('Histories (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let historyModel: Model<HistoryDocument>;
  let userAToken: string;
  let userBToken: string;
  let film1Id: string;
  let film2Id: string;

  const USER_A = { email: 'histories-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'histories-user-b@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_histories_e2e');
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
    historyModel = app.get<Model<HistoryDocument>>(getModelToken(History.name));

    const film1 = await filmModel.create({ slug: 'phim-xem-tiep-1', title: 'Phim Xem Tiếp 1' });
    film1Id = film1._id.toString();
    const film2 = await filmModel.create({ slug: 'phim-xem-tiep-2', title: 'Phim Xem Tiếp 2' });
    film2Id = film2._id.toString();

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
    it('POST /histories không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .send({ film: film1Id, progressSeconds: 10 });
      expect(res.status).toBe(401);
    });

    it('GET /histories/recent không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/histories/recent');
      expect(res.status).toBe(401);
    });

    it('GET /histories/film/:filmId không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/histories/film/${film1Id}`);
      expect(res.status).toBe(401);
    });

    it('DELETE /histories/:filmId không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).delete(`/api/v1/histories/${film1Id}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('film không phải ObjectId hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: 'khong-hop-le', progressSeconds: 10 });
      expect(res.status).toBe(400);
    });

    it('progressSeconds âm -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: film1Id, progressSeconds: -5 });
      expect(res.status).toBe(400);
    });
  });

  describe('Upsert tiến độ xem — xác minh hành vi ghi/đọc (nghi vấn ObjectId-cast, giống pattern Ratings)', () => {
    it('POST /histories tạo mới lịch sử xem cho phim 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: film1Id, episodeSlug: 'tap-1', serverName: 'Server #1', progressSeconds: 120 });

      expect(res.status).toBe(201);
      expect(res.body.data.episodeSlug).toBe('tap-1');
      expect(res.body.data.progressSeconds).toBe(120);
    });

    it('GET /histories/film/:filmId đọc lại đúng bản ghi vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).not.toBeNull();
      expect(res.body.data.progressSeconds).toBe(120);
    });

    it('GET /histories/film/:filmId cho phim CHƯA xem trả về null', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film2Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('POST /histories lần 2 (cùng phim) ghi đè tiến độ — không tạo bản ghi trùng', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: film1Id, progressSeconds: 500 });

      expect(res.status).toBe(201);
      expect(res.body.data.progressSeconds).toBe(500);

      const raw = await historyModel.find({}).exec();
      expect(raw).toHaveLength(1);
    });

    it('[Xác minh kiểu dữ liệu] History.user/History.film được lưu — kiểm tra trực tiếp để kết luận nghi vấn ObjectId-cast', async () => {
      const raw = await historyModel.collection.findOne({});
      // Ghi lại constructor thực tế của field để có bằng chứng cụ thể trong Completion Report —
      // không phải file debug, đây là một phần cố định của bộ E2E test.
      expect(raw).not.toBeNull();
      // eslint-disable-next-line no-console
      console.log(
        `[histories e2e] History.user type=${raw?.user?.constructor?.name}, History.film type=${raw?.film?.constructor?.name}`,
      );
    });

    it('POST /histories cho phim 2 (khác phim, cùng user) tạo bản ghi riêng biệt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/histories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: film2Id, progressSeconds: 30 });
      expect(res.status).toBe(201);

      const film1History = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      const film2History = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film2Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(film1History.body.data.progressSeconds).toBe(500);
      expect(film2History.body.data.progressSeconds).toBe(30);
    });
  });

  describe('GET /histories/recent — populate film (bao gồm isPublished)', () => {
    it('trả về danh sách đã populate, có field isPublished trong film', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/histories/recent')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      const item = res.body.data.items.find((h: any) => h.film?.slug === 'phim-xem-tiep-1');
      expect(item.film).toMatchObject({ title: 'Phim Xem Tiếp 1', isPublished: true });
    });

    it('sắp xếp theo lastWatchedAt giảm dần (phim xem gần nhất lên đầu)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/histories/recent')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.items[0].film.slug).toBe('phim-xem-tiep-2');
    });
  });

  describe('Cách ly theo user', () => {
    it('User B không thấy lịch sử xem của User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/histories/recent')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('User B xoá lịch sử xem phim mà User A đã xem (chưa từng xem) -> 404, không ảnh hưởng dữ liệu của A', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/histories/${film1Id}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);

      const stillThere = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(stillThere.body.data).not.toBeNull();
    });
  });

  describe('DELETE /histories/:filmId', () => {
    it('chủ sở hữu xoá thành công -> 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/histories/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/histories/film/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(after.body.data).toBeNull();
    });

    it('xoá lại lần nữa (đã xoá rồi) -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/histories/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });
  });
});
