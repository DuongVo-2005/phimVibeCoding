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
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Episodes (e2e) — Phase 35', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let adminToken: string;
  let userToken: string;
  let filmId: string;

  const ADMIN = { email: 'episodes-admin@e2e.test', password: 'Password123' };
  const REGULAR_USER = { email: 'episodes-user@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_episodes_e2e');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.JWT_EMAIL_VERIFICATION_SECRET = 'e2e-email-verification-secret';
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
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    // DB in-memory không tự chạy seed-rbac.ts — seed thủ công đúng permission module này cần
    // (films:update, grantToUser:false trong seed thật) + role "user" mặc định (để register không
    // lỗi khi resolve default role) — cùng pattern users-admin.e2e-spec.ts / notifications.e2e-spec.ts.
    const permFilmsUpdate = await permissionModel.create({
      key: 'films:update',
      resource: 'films',
      action: 'update',
    });
    const adminRole = await roleModel.create({ name: 'episodes-admin-role', isSystem: false });
    await rolePermissionModel.create({ role: adminRole._id, permission: permFilmsUpdate._id });
    await roleModel.create({ name: 'user', isSystem: true });

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(REGULAR_USER);
    await userModel.updateOne({ email: ADMIN.email }, { role: 'admin', roleIds: [adminRole._id] });

    const loginAdmin = await request(app.getHttpServer()).post('/api/v1/auth/login').send(ADMIN);
    adminToken = loginAdmin.body.data.accessToken;
    const loginUser = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(REGULAR_USER);
    userToken = loginUser.body.data.accessToken;

    const film = await filmModel.create({ slug: 'phim-episodes-e2e', title: 'Phim Episodes E2E' });
    filmId = film._id.toString();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Auth guard + RBAC', () => {
    it('GET /films/:filmId/episodes không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/films/${filmId}/episodes`);
      expect(res.status).toBe(401);
    });

    it('user thường (không phải admin) -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /films/:filmId/episodes — rỗng ban đầu', () => {
    it('trả về mảng rỗng khi phim chưa có tập nào', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /films/:filmId/episodes — validation', () => {
    it('phim không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/films/65f1a2b3c4d5e6f7a8b9c0d1/episodes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 1, title: 'Tập 1' });
      expect(res.status).toBe(404);
    });

    it('thiếu title (required) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 1 });
      expect(res.status).toBe(400);
    });

    it('episodeNumber < 1 -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 0, title: 'Tập 0' });
      expect(res.status).toBe(400);
    });

    it('embedUrl không phải URL hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 1, title: 'Tập 1', embedUrl: 'khong-phai-url' });
      expect(res.status).toBe(400);
    });

    it('embedUrl rỗng ("") -> 201, KHÔNG bị coi là URL không hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 100, title: 'Tập rỗng URL', embedUrl: '' });
      expect(res.status).toBe(201);
      expect(res.body.data.embedUrl).toBe('');
      await request(app.getHttpServer())
        .delete(`/api/v1/episodes/${res.body.data._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('Luồng đầy đủ: create 3 tập -> reorder -> update -> delete', () => {
    let episode1Id: string;
    let episode2Id: string;
    let episode3Id: string;

    it('tạo 3 tập liên tiếp -> displayOrder tự tăng 0,1,2 (append cuối)', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 1, title: 'Tập 1', m3u8Url: 'https://example.com/tap-1.m3u8' });
      expect(res1.status).toBe(201);
      expect(res1.body.data.displayOrder).toBe(0);
      expect(res1.body.data.isPublished).toBe(true);
      episode1Id = res1.body.data._id;

      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 2, title: 'Tập 2' });
      expect(res2.body.data.displayOrder).toBe(1);
      episode2Id = res2.body.data._id;

      const res3 = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 3, title: 'Tập 3' });
      expect(res3.body.data.displayOrder).toBe(2);
      episode3Id = res3.body.data._id;
    });

    it('trùng episodeNumber trong cùng phim -> 409', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 1, title: 'Tập 1 trùng' });
      expect(res.status).toBe(409);
    });

    it('GET list trả về đúng 3 tập, sort theo displayOrder tăng dần', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.map((e: any) => e.displayOrder)).toEqual([0, 1, 2]);
      expect(res.body.data.map((e: any) => e.episodeNumber)).toEqual([1, 2, 3]);
    });

    it('PATCH /episodes/:id sửa title -> 200, persist đúng', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Tập 1 (đã sửa)' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Tập 1 (đã sửa)');
    });

    it('PATCH đổi episodeNumber trùng tập khác -> 409', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ episodeNumber: 2 });
      expect(res.status).toBe(409);
    });

    it('PATCH /episodes/:id/order: di chuyển tập 1 (pos 0) -> pos 2, các tập còn lại dịch tối thiểu', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}/order`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayOrder: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.displayOrder).toBe(2);

      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`);
      const byId = Object.fromEntries(listRes.body.data.map((e: any) => [e._id, e.displayOrder]));
      expect(byId[episode2Id]).toBe(0);
      expect(byId[episode3Id]).toBe(1);
      expect(byId[episode1Id]).toBe(2);
    });

    it('PATCH .../order với displayOrder ngoài phạm vi (>= tổng số tập) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}/order`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayOrder: 99 });
      expect(res.status).toBe(400);
    });

    it('PATCH/DELETE tập không tồn tại -> 404', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch('/api/v1/episodes/65f1a2b3c4d5e6f7a8b9c0d1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'x' });
      expect(patchRes.status).toBe(404);

      const deleteRes = await request(app.getHttpServer())
        .delete('/api/v1/episodes/65f1a2b3c4d5e6f7a8b9c0d1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(404);
    });

    it('DELETE tập ở giữa (hiện displayOrder=0, sau di chuyển ở trên là episode2) -> các tập sau dồn lại', async () => {
      // Sau bước reorder ở trên: episode2Id=0, episode3Id=1, episode1Id=2.
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/episodes/${episode2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/films/${filmId}/episodes`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.body.data).toHaveLength(2);
      const byId = Object.fromEntries(listRes.body.data.map((e: any) => [e._id, e.displayOrder]));
      expect(byId[episode3Id]).toBe(0);
      expect(byId[episode1Id]).toBe(1);
    });

    it('PATCH isPublished=false rồi true -> publish/unpublish hoạt động đúng, persist qua GET lại', async () => {
      const unpublishRes = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: false });
      expect(unpublishRes.body.data.isPublished).toBe(false);

      const republishRes = await request(app.getHttpServer())
        .patch(`/api/v1/episodes/${episode1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: true });
      expect(republishRes.body.data.isPublished).toBe(true);
    });
  });
});
