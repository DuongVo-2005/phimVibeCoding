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
import {
  CrawlerHistory,
  CrawlerHistoryDocument,
} from '../src/crawler-history/schemas/crawler-history.schema';
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Crawler History (e2e) — RBAC Retrofit (Phase 6.2, permission ở class-level)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userToken: string;
  let adminToken: string;
  let adminNoPermissionToken: string;
  let historyId: string;

  const USER = { email: 'crawler-history-user@e2e.test', password: 'Password123' };
  const ADMIN = { email: 'crawler-history-admin@e2e.test', password: 'Password123' };
  const ADMIN_NO_PERMISSION = {
    email: 'crawler-history-admin-no-perm@e2e.test',
    password: 'Password123',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_crawler_history_e2e');
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

    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );
    const crawlerHistoryModel = app.get<Model<CrawlerHistoryDocument>>(
      getModelToken(CrawlerHistory.name),
    );

    const startedAt = new Date();
    const record = await crawlerHistoryModel.create({
      runId: 'run-e2e-1',
      source: 'ophim-films',
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 1000),
      durationMs: 1000,
      status: 'SUCCESS',
      added: 1,
      updated: 0,
      failed: 0,
      errorMessage: null,
      cronExpression: 'manual',
    });
    historyId = record._id.toString();

    const permission = await permissionModel.create({
      key: 'crawler-history:read',
      resource: 'crawler-history',
      action: 'read',
    });
    const role = await roleModel.create({ name: 'crawler-history-admin', isSystem: false });
    await rolePermissionModel.create({ role: role._id, permission: permission._id });

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_NO_PERMISSION);
    await userModel.updateOne({ email: ADMIN.email }, { role: 'admin', roleIds: [role._id] });
    await userModel.updateOne({ email: ADMIN_NO_PERMISSION.email }, { role: 'admin' });

    const loginUser = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER);
    userToken = loginUser.body.data.accessToken;
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

  describe('GET /crawler-history', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/crawler-history');
      expect(res.status).toBe(401);
    });

    it('user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crawler-history')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('admin THIẾU permission crawler-history:read -> 403 (permission gắn class-level vẫn hoạt động đúng)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crawler-history')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin CÓ permission crawler-history:read -> 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crawler-history')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /crawler-history/:id', () => {
    it('admin THIẾU permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/crawler-history/${historyId}`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin CÓ permission -> 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/crawler-history/${historyId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.runId).toBe('run-e2e-1');
    });
  });
});
