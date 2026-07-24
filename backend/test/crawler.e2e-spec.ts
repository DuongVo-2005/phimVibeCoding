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
import { CrawlerService } from '../src/crawler/crawler.service';
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

// CrawlerService thật gọi HTTP thật ra ophim1.com — mock ở tầng DI (overrideProvider) để bài test
// chỉ xác minh guard/permission chain (Phase 6.2), không phụ thuộc mạng ngoài/flaky. Guard vẫn
// chạy đầy đủ qua HTTP thật (Nest routing + JwtAuthGuard/RolesGuard/PermissionsGuard).
describe('Crawler (e2e) — RBAC Retrofit (Phase 6.2)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userToken: string;
  let adminRunToken: string;
  let adminSyncToken: string;
  let adminNoPermissionToken: string;
  const crawlerServiceMock = {
    syncFilmList: jest.fn().mockResolvedValue({ processed: 0, succeeded: 0, failed: 0, added: 0, updated: 0 }),
    syncFilmDetail: jest.fn().mockResolvedValue({ success: true, isNew: false }),
    syncTypes: jest.fn().mockResolvedValue({ totalTypes: 0 }),
  };

  const USER = { email: 'crawler-user@e2e.test', password: 'Password123' };
  const ADMIN_RUN = { email: 'crawler-admin-run@e2e.test', password: 'Password123' };
  const ADMIN_SYNC = { email: 'crawler-admin-sync@e2e.test', password: 'Password123' };
  const ADMIN_NO_PERMISSION = {
    email: 'crawler-admin-no-perm@e2e.test',
    password: 'Password123',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_crawler_e2e');
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.OPHIM_API_BASE_URL = 'https://ophim1.com';
    process.env.OPHIM_CRAWLER_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CrawlerService)
      .useValue(crawlerServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ParseObjectIdPipe(),
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    const permissions = await permissionModel.insertMany(
      ['crawler:run', 'crawler:sync'].map((key) => ({
        key,
        resource: key.split(':')[0],
        action: key.split(':')[1],
      })),
    );
    const runPermission = permissions.find((p) => p.key === 'crawler:run')!;
    const syncPermission = permissions.find((p) => p.key === 'crawler:sync')!;

    const runRole = await roleModel.create({ name: 'crawler-run-admin', isSystem: false });
    await rolePermissionModel.create({ role: runRole._id, permission: runPermission._id });

    const syncRole = await roleModel.create({ name: 'crawler-sync-admin', isSystem: false });
    await rolePermissionModel.create({ role: syncRole._id, permission: syncPermission._id });

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_RUN);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_SYNC);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_NO_PERMISSION);
    await userModel.updateOne(
      { email: ADMIN_RUN.email },
      { role: 'admin', roleIds: [runRole._id] },
    );
    await userModel.updateOne(
      { email: ADMIN_SYNC.email },
      { role: 'admin', roleIds: [syncRole._id] },
    );
    await userModel.updateOne({ email: ADMIN_NO_PERMISSION.email }, { role: 'admin' });

    const loginUser = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER);
    userToken = loginUser.body.data.accessToken;
    const loginAdminRun = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_RUN);
    adminRunToken = loginAdminRun.body.data.accessToken;
    const loginAdminSync = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_SYNC);
    adminSyncToken = loginAdminSync.body.data.accessToken;
    const loginAdminNoPermission = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_NO_PERMISSION);
    adminNoPermissionToken = loginAdminNoPermission.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('POST /crawler/sync/films — crawler:run (khác crawler:sync)', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/crawler/sync/films');
      expect(res.status).toBe(401);
    });

    it('user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/films')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('admin CÓ crawler:sync nhưng THIẾU crawler:run -> 403 (2 permission tách biệt đúng thiết kế)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/films')
        .set('Authorization', `Bearer ${adminSyncToken}`);
      expect(res.status).toBe(403);
    });

    it('admin CÓ crawler:run -> lọt qua guard (không phải 401/403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/films')
        .set('Authorization', `Bearer ${adminRunToken}`);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(crawlerServiceMock.syncFilmList).toHaveBeenCalled();
    });
  });

  describe('POST /crawler/sync/film — crawler:sync', () => {
    it('admin CÓ crawler:run nhưng THIẾU crawler:sync -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/film')
        .set('Authorization', `Bearer ${adminRunToken}`)
        .send({ slug: 'phim-test' });
      expect(res.status).toBe(403);
    });

    it('admin CÓ crawler:sync -> lọt qua guard', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/film')
        .set('Authorization', `Bearer ${adminSyncToken}`)
        .send({ slug: 'phim-test' });
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(crawlerServiceMock.syncFilmDetail).toHaveBeenCalledWith('phim-test');
    });
  });

  describe('POST /crawler/sync/types — crawler:sync', () => {
    it('admin THIẾU mọi permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/types')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin CÓ crawler:sync -> lọt qua guard', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crawler/sync/types')
        .set('Authorization', `Bearer ${adminSyncToken}`);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(crawlerServiceMock.syncTypes).toHaveBeenCalled();
    });
  });
});
