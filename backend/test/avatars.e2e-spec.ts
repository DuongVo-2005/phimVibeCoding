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
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Avatars (e2e) — RBAC Retrofit (Phase 6.2)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userToken: string;
  let adminToken: string;
  let adminNoPermissionToken: string;
  let typeAvatarId: string;
  let imgAvatarId: string;

  const USER = { email: 'avatars-user@e2e.test', password: 'Password123' };
  const ADMIN = { email: 'avatars-admin@e2e.test', password: 'Password123' };
  const ADMIN_NO_PERMISSION = {
    email: 'avatars-admin-no-perm@e2e.test',
    password: 'Password123',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_avatars_e2e');
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

    const permissions = await permissionModel.insertMany(
      ['avatars:manage'].map((key) => ({
        key,
        resource: key.split(':')[0],
        action: key.split(':')[1],
      })),
    );
    const role = await roleModel.create({ name: 'avatars-admin', isSystem: false });
    await rolePermissionModel.insertMany(
      permissions.map((permission) => ({ role: role._id, permission: permission._id })),
    );

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

  describe('Route Public vẫn Public', () => {
    it('GET /avatars/types không cần token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/avatars/types');
      expect(res.status).toBe(200);
    });

    it('GET /avatars/images không cần token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/avatars/images');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /avatars/types — avatars:manage', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/types')
        .send({ name: 'Hoạt hình' });
      expect(res.status).toBe(401);
    });

    it('user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/types')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hoạt hình' });
      expect(res.status).toBe(403);
    });

    it('admin THIẾU permission avatars:manage -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/types')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`)
        .send({ name: 'Hoạt hình' });
      expect(res.status).toBe(403);
    });

    it('admin CÓ permission avatars:manage -> 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Hoạt hình' });
      expect(res.status).toBe(201);
      typeAvatarId = res.body.data.id ?? res.body.data._id;
    });
  });

  describe('POST /avatars/images — avatars:manage', () => {
    it('admin THIẾU permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/images')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`)
        .send({ type: typeAvatarId, url: 'https://example.com/a.png' });
      expect(res.status).toBe(403);
    });

    it('admin CÓ permission -> 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/avatars/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: typeAvatarId, url: 'https://example.com/a.png' });
      expect(res.status).toBe(201);
      imgAvatarId = res.body.data.id ?? res.body.data._id;
    });
  });

  describe('DELETE /avatars/images/:id, /avatars/types/:id — avatars:manage', () => {
    it('DELETE /avatars/images/:id admin THIẾU permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/avatars/images/${imgAvatarId}`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('DELETE /avatars/images/:id admin CÓ permission -> 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/avatars/images/${imgAvatarId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('DELETE /avatars/types/:id admin THIẾU permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/avatars/types/${typeAvatarId}`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('DELETE /avatars/types/:id admin CÓ permission -> 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/avatars/types/${typeAvatarId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
