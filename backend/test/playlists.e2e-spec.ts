import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';
import { Film, FilmDocument } from '../src/films/schemas/film.schema';
import { Playlist, PlaylistDocument } from '../src/playlists/schemas/playlist.schema';

describe('Playlists (e2e) — Phase 6.3', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let playlistModel: Model<PlaylistDocument>;
  let userAToken: string;
  let userBToken: string;
  let film1Id: string;
  let film2Id: string;

  const USER_A = { email: 'playlists-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'playlists-user-b@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_playlists_e2e');
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
    playlistModel = app.get<Model<PlaylistDocument>>(getModelToken(Playlist.name));

    const film1 = await filmModel.create({ slug: 'phim-playlist-1', title: 'Phim Playlist 1' });
    film1Id = film1._id.toString();
    const film2 = await filmModel.create({ slug: 'phim-playlist-2', title: 'Phim Playlist 2' });
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

  describe('Auth guard — chỉ dùng JWT hiện có', () => {
    it('POST /playlists không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .send({ name: 'Xem sau' });
      expect(res.status).toBe(401);
    });

    it('GET /playlists không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/playlists');
      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('POST /playlists name rỗng -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });

    it('POST /playlists name vượt quá 100 ký tự -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'a'.repeat(101) });
      expect(res.status).toBe(400);
    });

    it('POST /playlists/:id/films filmId không phải ObjectId hợp lệ -> 400', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Tạm' });
      const id = create.body.data.id ?? create.body.data._id;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/playlists/${id}/films`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ filmId: 'khong-hop-le' });
      expect(res.status).toBe(400);
    });
  });

  describe('CRUD', () => {
    let playlistId: string;

    it('POST /playlists tạo playlist mới -> 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Xem sau' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Xem sau');
      playlistId = res.body.data.id ?? res.body.data._id;
    });

    it('GET /playlists trả về danh sách playlist của chính user (không phân trang — trả mảng thẳng)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: any) => (p.id ?? p._id) === playlistId)).toBe(true);
    });

    it('GET /playlists/:id trả về đúng playlist, films đã populate rỗng ban đầu', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Xem sau');
      expect(res.body.data.films).toEqual([]);
    });

    it('GET /playlists/:id không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/playlists/65f1a2b3c4d5e6f7a8b9c0ff')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    it('PATCH /playlists/:id đổi tên -> 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Xem sau (đã đổi tên)' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Xem sau (đã đổi tên)');
    });

    it('DELETE /playlists/:id xoá thành công -> 200, GET lại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(after.status).toBe(404);
    });
  });

  describe('Ownership — user B không truy cập được playlist của user A', () => {
    let playlistId: string;

    it('setup: User A tạo playlist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Playlist riêng tư của A' });
      playlistId = res.body.data.id ?? res.body.data._id;
    });

    it('User B GET playlist của A -> 404 (không phải 403 — ownership lồng trong filter truy vấn)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);
    });

    it('User B PATCH playlist của A -> 404', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Chiếm đoạt' });
      expect(res.status).toBe(404);
    });

    it('User B DELETE playlist của A -> 404, playlist của A vẫn còn nguyên', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);

      const stillThere = await request(app.getHttpServer())
        .get(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(stillThere.status).toBe(200);
    });

    it('User B GET /playlists (danh sách của chính mình) không thấy playlist của A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/playlists')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.body.data.some((p: any) => (p.id ?? p._id) === playlistId)).toBe(false);
    });

    it('User B thêm phim vào playlist của A -> 404', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/playlists/${playlistId}/films`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ filmId: film1Id });
      expect(res.status).toBe(404);
    });
  });

  describe('Add/Remove film — $addToSet / $pull, kiểm tra kiểu dữ liệu lưu trữ', () => {
    let playlistId: string;

    it('setup: tạo playlist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Playlist test film' });
      playlistId = res.body.data.id ?? res.body.data._id;
    });

    it('POST /playlists/:id/films thêm phim -> films có 1 phần tử', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/playlists/${playlistId}/films`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ filmId: film1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.films).toHaveLength(1);
      // GHI CHÚ (Phase 6.3 — phát hiện, chưa sửa, xem Completion Report): addFilm() không
      // populate('films'), khác với findOne() — response trả về ObjectId thô (chuỗi), không phải
      // {title,slug,...} như api_design.md §16 mô tả (PlaylistDetailResponseDto). Test này khẳng
      // định đúng HÀNH VI THỰC TẾ hiện tại, không phải hành vi mong muốn theo tài liệu.
      expect(typeof res.body.data.films[0]).toBe('string');
      expect(res.body.data.films[0]).toBe(film1Id);
    });

    it('[Xác minh kiểu dữ liệu] Playlist.films lưu dạng gì — kiểm tra trực tiếp raw document', async () => {
      const raw = await playlistModel.collection.findOne({ _id: new Types.ObjectId(playlistId) });
      expect(raw).not.toBeNull();
      expect(Array.isArray(raw?.films)).toBe(true);
      expect(raw?.films).toHaveLength(1);
      // eslint-disable-next-line no-console
      console.log(
        `[playlists e2e] Playlist.films[0] type=${raw?.films?.[0]?.constructor?.name}`,
      );
    });

    it('thêm CÙNG 1 phim lần 2 ($addToSet) -> vẫn chỉ 1 phần tử, không tạo trùng', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/playlists/${playlistId}/films`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ filmId: film1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.films).toHaveLength(1);
    });

    it('thêm phim thứ 2 (khác phim) -> films có 2 phần tử', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/playlists/${playlistId}/films`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ filmId: film2Id });

      expect(res.status).toBe(201);
      expect(res.body.data.films).toHaveLength(2);
    });

    it('DELETE /playlists/:id/films/:filmId xoá đúng 1 phim, giữ nguyên phim còn lại', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/playlists/${playlistId}/films/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.films).toHaveLength(1);
      // removeFilm() cũng không populate — cùng ghi chú như addFilm() ở trên.
      expect(res.body.data.films[0]).toBe(film2Id);
    });

    it('GET /playlists/:id (findOne, CÓ populate) sau khi thêm phim -> films trả về object đầy đủ dù lưu dạng String', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.films).toHaveLength(1);
      expect(res.body.data.films[0]).toMatchObject({ slug: 'phim-playlist-2' });
    });

    it('xoá phim KHÔNG có trong playlist -> vẫn 200 (no-op, $pull không lỗi khi không khớp)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/playlists/${playlistId}/films/${film1Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.films).toHaveLength(1);
    });
  });
});
