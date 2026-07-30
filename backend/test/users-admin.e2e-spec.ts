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

describe('Users Admin (e2e) — Phase 6.3 Giai đoạn 2A', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;

  let userToken: string;
  let adminToken: string;
  let adminId: string;
  let adminNoPermissionToken: string;

  let targetPatchRoleId: string;
  let targetDeleteId: string;
  let targetRolesId: string;
  let inactiveUserId: string;

  const USER = { email: 'users-admin-user@e2e.test', password: 'Password123' };
  const ADMIN = { email: 'users-admin-admin@e2e.test', password: 'Password123' };
  const ADMIN_NO_PERMISSION = {
    email: 'users-admin-admin-no-perm@e2e.test',
    password: 'Password123',
  };
  const TARGET_PATCH_ROLE = { email: 'users-admin-target-role@e2e.test', password: 'Password123' };
  const TARGET_DELETE = { email: 'users-admin-target-delete@e2e.test', password: 'Password123' };
  const TARGET_ROLES = { email: 'users-admin-target-roles@e2e.test', password: 'Password123' };
  const SEARCH_ALPHA = { email: 'alpha-search@e2e.test', password: 'Password123', name: 'Alpha Nguyen' };
  const SEARCH_BETA = { email: 'beta-search@e2e.test', password: 'Password123', name: 'Beta Tran' };
  const INACTIVE_USER = { email: 'users-admin-inactive@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_users_admin_e2e');
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

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    const permManage = await permissionModel.create({
      key: 'users:manage',
      resource: 'users',
      action: 'manage',
    });
    const permRead = await permissionModel.create({
      key: 'users:read',
      resource: 'users',
      action: 'read',
    });
    const fullRole = await roleModel.create({ name: 'users-full-admin', isSystem: false });
    await rolePermissionModel.create({ role: fullRole._id, permission: permManage._id });
    await rolePermissionModel.create({ role: fullRole._id, permission: permRead._id });

    // DB in-memory này không tự seed role "user" (script seed-rbac.ts chỉ chạy thủ công, không
    // chạy khi bootstrap app trong e2e) — nhưng UsersService.create() gọi getDefaultRoleIds() ->
    // rolesService.findByName('user') khi đăng ký. Seed sẵn role này để mọi user đăng ký bên dưới
    // có roleIds mặc định đúng như production, phục vụ test GET /users/:id/roles.
    await roleModel.create({ name: 'user', isSystem: true });

    // Đăng ký toàn bộ user cần dùng.
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN_NO_PERMISSION);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(TARGET_PATCH_ROLE);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(TARGET_DELETE);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(TARGET_ROLES);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(SEARCH_ALPHA);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(SEARCH_BETA);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(INACTIVE_USER);

    const adminUser = await userModel.findOne({ email: ADMIN.email });
    adminId = adminUser!._id.toString();
    await userModel.updateOne({ email: ADMIN.email }, { role: 'admin', roleIds: [fullRole._id] });
    await userModel.updateOne({ email: ADMIN_NO_PERMISSION.email }, { role: 'admin' });

    const targetPatchRoleUser = await userModel.findOne({ email: TARGET_PATCH_ROLE.email });
    targetPatchRoleId = targetPatchRoleUser!._id.toString();
    const targetDeleteUser = await userModel.findOne({ email: TARGET_DELETE.email });
    targetDeleteId = targetDeleteUser!._id.toString();
    const targetRolesUser = await userModel.findOne({ email: TARGET_ROLES.email });
    targetRolesId = targetRolesUser!._id.toString();

    // Setup fixture trực tiếp qua DB (KHÔNG qua API updateStatus — route đó ngoài phạm vi test này) —
    // chỉ để có sẵn 1 user isActive=false phục vụ test filter GET /users?isActive=false.
    const inactiveUser = await userModel.findOne({ email: INACTIVE_USER.email });
    inactiveUserId = inactiveUser!._id.toString();
    await userModel.updateOne({ _id: inactiveUserId }, { isActive: false });

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

  describe('POST /users', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ email: 'x@e2e.test', password: 'Password123' });
      expect(res.status).toBe(401);
    });

    it('user thường (không phải admin) -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'x@e2e.test', password: 'Password123' });
      expect(res.status).toBe(403);
    });

    it('admin thiếu permission users:manage -> 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`)
        .send({ email: 'x@e2e.test', password: 'Password123' });
      expect(res.status).toBe(403);
    });

    it('validation: email không hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'khong-phai-email', password: 'Password123' });
      expect(res.status).toBe(400);
    });

    it('validation: password ngắn hơn 8 ký tự -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'valid@e2e.test', password: '1234567' });
      expect(res.status).toBe(400);
    });

    it('admin có permission -> 201, tạo user thành công với role mặc định "user"', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'created-by-admin@e2e.test', password: 'Password123', name: 'Created User' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('created-by-admin@e2e.test');
      expect(res.body.data.name).toBe('Created User');
      expect(res.body.data.role).toBe('user');
      // `select:false` trên schema chỉ áp dụng cho query (find/findOne...), KHÔNG áp dụng cho tài
      // liệu tạo qua `new Model().save()` — createByAdmin() trả thẳng document đó nên cần kiểm
      // tra rõ ràng password (hash) có bị lọt ra response hay không.
      expect(res.body.data.password).toBeUndefined();
    });

    it('email đã tồn tại -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'created-by-admin@e2e.test', password: 'Password123' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /users', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('admin thiếu permission users:read -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin có permission -> 200, trả về danh sách phân trang', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.meta).toEqual(
        expect.objectContaining({ page: 1, limit: expect.any(Number), totalItems: expect.any(Number) }),
      );
      expect(res.body.data.items.length).toBeGreaterThan(0);
      // password (dù select:false ở schema) không được lọt ra qua GET list.
      expect(res.body.data.items[0].password).toBeUndefined();
    });

    it('search theo tên -> chỉ trả về user khớp', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ search: 'Alpha Nguyen' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items.every((u: any) => u.email === SEARCH_ALPHA.email)).toBe(true);
    });

    it('lọc theo role -> chỉ trả về đúng role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ role: 'admin' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.every((u: any) => u.role === 'admin')).toBe(true);
      expect(res.body.data.items.some((u: any) => u.email === ADMIN.email)).toBe(true);
    });

    it('phân trang: limit=1 -> chỉ 1 item, meta.totalPages > 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.meta.totalPages).toBeGreaterThan(1);
    });

    it('isActive=false qua query string -> chỉ trả về user inactive (regression test cho bug cast @Type(()=>Boolean) đã fix bằng @Transform, xem QueryUserDto)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ isActive: 'false' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const emails = res.body.data.items.map((u: any) => u.email);
      expect(emails).toContain(INACTIVE_USER.email);
      expect(res.body.data.items.every((u: any) => u.isActive === false)).toBe(true);
    });

    it('isActive=true qua query string -> chỉ trả về user active (không bị ảnh hưởng bởi bug ở trên)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ isActive: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.every((u: any) => u.isActive === true)).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/users/${adminId}`);
      expect(res.status).toBe(401);
    });

    it('admin thiếu permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${adminId}`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin có permission, tồn tại -> 200 đúng dữ liệu, không lộ password', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${targetRolesId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(TARGET_ROLES.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('không tồn tại (ObjectId hợp lệ nhưng không có user) -> 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/65f1a2b3c4d5e6f7a8b9c0d1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('id không phải ObjectId hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /users/:id/role', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).patch(`/api/v1/users/${targetPatchRoleId}/role`);
      expect(res.status).toBe(401);
    });

    it('admin thiếu permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${targetPatchRoleId}/role`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`)
        .send({ role: 'admin' });
      expect(res.status).toBe(403);
    });

    it('validation: role không thuộc enum hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${targetPatchRoleId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'khong-ton-tai' });
      expect(res.status).toBe(400);
    });

    it('không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/65f1a2b3c4d5e6f7a8b9c0d1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });
      expect(res.status).toBe(404);
    });

    it('admin tự đổi role chính mình -> 409 (self-lockout)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });
      expect(res.status).toBe(409);
    });

    it('admin có permission, đổi role thành công -> 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${targetPatchRoleId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });
  });

  describe('GET /users/:id/roles', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/users/${targetRolesId}/roles`);
      expect(res.status).toBe(401);
    });

    it('admin thiếu permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${targetRolesId}/roles`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('admin có permission, tồn tại -> 200, trả về mảng roles (mặc định role "user")', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${targetRolesId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe('user');
    });

    it('không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/65f1a2b3c4d5e6f7a8b9c0d1/roles')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).delete(`/api/v1/users/${targetDeleteId}`);
      expect(res.status).toBe(401);
    });

    it('admin thiếu permission -> 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${targetDeleteId}`)
        .set('Authorization', `Bearer ${adminNoPermissionToken}`);
      expect(res.status).toBe(403);
    });

    it('không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/users/65f1a2b3c4d5e6f7a8b9c0d1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('admin tự xoá chính mình -> 409 (self-lockout)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });

    it('admin có permission, xoá thành công -> 200, sau đó GET lại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${targetDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const getAfter = await request(app.getHttpServer())
        .get(`/api/v1/users/${targetDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getAfter.status).toBe(404);
    });
  });
});
