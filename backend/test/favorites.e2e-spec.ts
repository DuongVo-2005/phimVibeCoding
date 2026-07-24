import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Actor, ActorDocument } from '../src/actors/schemas/actor.schema';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';
import { Film, FilmDocument } from '../src/films/schemas/film.schema';

describe('Favorites (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let actorModel: Model<ActorDocument>;
  let userAToken: string;
  let userBToken: string;
  let filmId: string;
  let actorId: string;

  const USER_A = { email: 'favorites-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'favorites-user-b@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_favorites_e2e');
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
    actorModel = app.get<Model<ActorDocument>>(getModelToken(Actor.name));

    const film = await filmModel.create({ slug: 'phim-yeu-thich', title: 'Phim Yêu Thích' });
    filmId = film._id.toString();

    const actor = await actorModel.create({ slug: 'dien-vien-a', name: 'Diễn Viên A' });
    actorId = actor._id.toString();

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
    it('POST /favorites không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .send({ targetType: 'film', target: filmId });
      expect(res.status).toBe(401);
    });

    it('GET /favorites không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/favorites?targetType=film');
      expect(res.status).toBe(401);
    });

    it('DELETE /favorites/:targetType/:targetId không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).delete(`/api/v1/favorites/film/${filmId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('POST /favorites targetType không hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetType: 'khong-hop-le', target: filmId });
      expect(res.status).toBe(400);
    });

    it('POST /favorites target không phải ObjectId hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetType: 'film', target: 'khong-phai-object-id' });
      expect(res.status).toBe(400);
    });

    it('GET /favorites thiếu targetType (required) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('Thêm/xem/xoá yêu thích — chỉ thao tác trên dữ liệu của chính user', () => {
    it('POST /favorites thêm phim vào yêu thích (User A)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetType: 'film', target: filmId });

      expect(res.status).toBe(201);
      expect(res.body.data.targetType).toBe('film');
      expect(res.body.data.target).toBe(filmId);
    });

    it('POST /favorites thêm lại cùng 1 phim -> idempotent, không tạo bản ghi trùng', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetType: 'film', target: filmId });
      expect(res.status).toBe(201);

      const list = await request(app.getHttpServer())
        .get('/api/v1/favorites?targetType=film')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(list.body.data.items).toHaveLength(1);
      expect(list.body.data.meta.totalItems).toBe(1);
    });

    it('GET /favorites?targetType=film trả về phim đã populate đầy đủ', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/favorites?targetType=film')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].target).toMatchObject({
        slug: 'phim-yeu-thich',
        title: 'Phim Yêu Thích',
      });
    });

    it('POST /favorites thêm diễn viên vào yêu thích (User A)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetType: 'actor', target: actorId });

      expect(res.status).toBe(201);

      const list = await request(app.getHttpServer())
        .get('/api/v1/favorites?targetType=actor')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(list.body.data.items).toHaveLength(1);
      expect(list.body.data.items[0].target).toMatchObject({ slug: 'dien-vien-a', name: 'Diễn Viên A' });
    });

    it('User B không thấy favorites của User A (cách ly theo user)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/favorites?targetType=film')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('DELETE /favorites/:targetType/:targetId — User B xoá mục không phải của mình -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/favorites/film/${filmId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('DELETE /favorites/:targetType/:targetId — User A xoá đúng mục của mình -> 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/favorites/film/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);

      const list = await request(app.getHttpServer())
        .get('/api/v1/favorites?targetType=film')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(list.body.data.items).toHaveLength(0);
    });

    it('DELETE lại lần nữa (đã xoá rồi) -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/favorites/film/${filmId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
    });
  });
});
