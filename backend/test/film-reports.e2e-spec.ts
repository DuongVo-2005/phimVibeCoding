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

describe('Film Reports (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let userModel: Model<UserDocument>;
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let adminNoPermissionToken: string;
  let filmId: string;

  const USER = { email: 'film-reports-user@e2e.test', password: 'Password123' };
  const ADMIN = { email: 'film-reports-admin@e2e.test', password: 'Password123' };
  const ADMIN_NO_PERMISSION = {
    email: 'film-reports-admin-no-perm@e2e.test',
    password: 'Password123',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_film_reports_e2e');
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
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    const film = await filmModel.create({ slug: 'phim-bi-loi', title: 'Phim Bị Lỗi' });
    filmId = film._id.toString();

    // Role RBAC có đủ film-reports:read + film-reports:update (Phase 6.2) — dùng cho admin "đủ
    // quyền". Admin "thiếu quyền" (role='admin' hợp lệ nhưng KHÔNG gán roleIds nào) dùng để xác
    // minh @RequirePermission() thực sự chặn dù đã qua được @Roles(ADMIN).
    const permissions = await permissionModel.insertMany(
      ['film-reports:read', 'film-reports:update'].map((key) => ({
        key,
        resource: key.split(':')[0],
        action: key.split(':')[1],
      })),
    );
    const role = await roleModel.create({ name: 'film-reports-admin', isSystem: false });
    await rolePermissionModel.insertMany(
      permissions.map((permission) => ({ role: role._id, permission: permission._id })),
    );

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_NO_PERMISSION);
    await userModel.updateOne(
      { email: ADMIN.email },
      { role: 'admin', roleIds: [role._id] },
    );
    // role='admin' (qua được @Roles(ADMIN)) nhưng roleIds rỗng -> PermissionResolverService trả
    // về tập permission rỗng -> phải bị PermissionsGuard chặn 403.
    await userModel.updateOne({ email: ADMIN_NO_PERMISSION.email }, { role: 'admin' });

    const loginUser = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER);
    userToken = loginUser.body.data.accessToken;
    userId = loginUser.body.data.user.id;
    const loginAdmin = await request(app.getHttpServer()).post('/api/v1/auth/login').send(ADMIN);
    adminToken = loginAdmin.body.data.accessToken;
    const loginAdminNoPermission = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_NO_PERMISSION);
    adminNoPermissionToken = loginAdminNoPermission.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Validation', () => {
    it('reason rỗng -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .send({ film: filmId, reason: '' });
      expect(res.status).toBe(400);
    });

    it('film không phải ObjectId hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .send({ film: 'khong-hop-le', reason: 'Video lỗi' });
      expect(res.status).toBe(400);
    });

    it('gửi kèm field userId trong body -> 400 (field đã bị loại khỏi DTO, không còn được chấp nhận — Phase 6.1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .send({ film: filmId, reason: 'Video lỗi', userId: '65f1a2b3c4d5e6f7a8b9c0ff' });
      expect(res.status).toBe(400);
    });
  });

  describe('Bảo mật (Phase 6.1): userId lấy từ JWT, không tin client', () => {
    it('báo cáo ẩn danh (không token) -> user = null', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .send({ film: filmId, reason: 'Video không phát được' });

      expect(res.status).toBe(201);
      expect(res.body.data.user).toBeNull();
    });

    it('báo cáo có đăng nhập -> user = đúng userId thật từ JWT, không thể giả mạo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/film-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ film: filmId, reason: 'Phụ đề sai' });

      expect(res.status).toBe(201);
      expect(res.body.data.user).toBe(userId);
    });
  });

  describe('Admin — findAll / updateStatus', () => {
    it('GET /film-reports không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/film-reports');
      expect(res.status).toBe(401);
    });

    it('GET /film-reports với user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /film-reports với admin -> 200, thấy cả report ẩn danh lẫn có user, film đã populate', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.items[0].film).toMatchObject({ slug: 'phim-bi-loi' });
    });

    it('GET /film-reports với admin THIẾU permission film-reports:read -> 403 (Phase 6.2 — RBAC Retrofit)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('PATCH /film-reports/:id/status với user thường -> 403', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${adminToken}`);
      const reportId = list.body.data.items[0].id ?? list.body.data.items[0]._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/film-reports/${reportId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(403);
    });

    it('PATCH /film-reports/:id/status với admin -> 200, cập nhật đúng status', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${adminToken}`);
      const reportId = list.body.data.items[0].id ?? list.body.data.items[0]._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/film-reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
    });

    it('PATCH /film-reports/:id/status với admin THIẾU permission film-reports:update -> 403 (Phase 6.2)', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/film-reports')
        .set('Authorization', `Bearer ${adminToken}`);
      const reportId = list.body.data.items[0].id ?? list.body.data.items[0]._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/film-reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(403);
    });

    it('GET /film-reports?status=resolved lọc đúng', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/film-reports?status=resolved')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.every((r: any) => r.status === 'resolved')).toBe(true);
    });
  });
});
