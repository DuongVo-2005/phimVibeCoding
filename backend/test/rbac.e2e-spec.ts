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

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let roleModel: Model<RoleDocument>;
  let permissionModel: Model<PermissionDocument>;
  let rolePermissionModel: Model<RolePermissionDocument>;

  const SUPER_ADMIN = { email: 'super-admin@rbac-e2e.test', password: 'Password123' };
  const LIMITED_ADMIN = { email: 'limited-admin@rbac-e2e.test', password: 'Password123' };

  let superAdminToken: string;
  let limitedAdminToken: string;
  let rolesManagePermissionId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_rbac_e2e');
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
    roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    // Bootstrap tối giản: tạo trực tiếp (không qua API) 1 role gom đủ quyền RBAC-quản-trị,
    // để có một tài khoản admin "gốc" đủ khả năng gọi API tạo role/gán quyền trong test —
    // mô phỏng những gì `seed:rbac` làm ở môi trường thật, thu gọn phạm vi cho test này.
    const bootstrapPermissions = await permissionModel.insertMany([
      { key: 'roles:manage', resource: 'roles', action: 'manage', description: '' },
      { key: 'permissions:manage', resource: 'permissions', action: 'manage', description: '' },
      { key: 'users:manage', resource: 'users', action: 'manage', description: '' },
    ]);
    rolesManagePermissionId = bootstrapPermissions[0].id;

    const bootstrapRole = await roleModel.create({ name: 'bootstrap-admin', isSystem: false });
    await rolePermissionModel.insertMany(
      bootstrapPermissions.map((permission) => ({
        role: bootstrapRole._id,
        permission: permission._id,
      })),
    );

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(SUPER_ADMIN);
    await userModel.updateOne(
      { email: SUPER_ADMIN.email },
      { role: 'admin', roleIds: [bootstrapRole._id] },
    );

    // "limited-admin": hợp lệ theo role cũ (role='admin', qua được RolesGuard) nhưng CHƯA có
    // bất kỳ permission RBAC nào — dùng để chứng minh PermissionsGuard chặn thêm một lớp nữa.
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(LIMITED_ADMIN);
    await userModel.updateOne({ email: LIMITED_ADMIN.email }, { role: 'admin' });

    const superAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(SUPER_ADMIN);
    superAdminToken = superAdminLogin.body.data.accessToken;

    const limitedAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(LIMITED_ADMIN);
    limitedAdminToken = limitedAdminLogin.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('GET /api/v1/health vẫn hoạt động bình thường sau khi thêm PermissionsGuard toàn cục', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('admin hợp lệ theo role cũ nhưng chưa có permission "roles:manage" -> 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${limitedAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bạn không có quyền thực hiện hành động này');
  });

  it('cùng admin đó vẫn bị 403 ở endpoint permissions:manage (permission khác, không tự động lan)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/permissions')
      .set('Authorization', `Bearer ${limitedAdminToken}`);

    expect(res.status).toBe(403);
  });

  it(
    'round-trip: tạo role mới -> gán permission "roles:manage" cho role -> gán role cho user -> ' +
      'user gọi được endpoint trước đó bị 403, KHÔNG cần đăng nhập lại',
    async () => {
      const createRoleRes = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'roles-viewer', description: 'Chỉ xem/quản lý role' });

      expect(createRoleRes.status).toBe(201);
      const newRoleId = createRoleRes.body.data.id ?? createRoleRes.body.data._id;

      const setPermissionsRes = await request(app.getHttpServer())
        .put(`/api/v1/roles/${newRoleId}/permissions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ permissionIds: [rolesManagePermissionId] });

      expect(setPermissionsRes.status).toBe(200);
      expect(setPermissionsRes.body.data).toHaveLength(1);

      const limitedAdmin = await userModel.findOne({ email: LIMITED_ADMIN.email }).exec();

      const assignRoleRes = await request(app.getHttpServer())
        .put(`/api/v1/users/${limitedAdmin!.id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roleIds: [newRoleId] });

      expect(assignRoleRes.status).toBe(200);

      // Cùng 1 token cũ, gọi lại endpoint TRƯỚC ĐÓ bị 403 — phải thành công ngay,
      // không cần đăng nhập lại (chứng minh PermissionResolverService.invalidate() hoạt động).
      const retryRes = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${limitedAdminToken}`);

      expect(retryRes.status).toBe(200);

      // Nhưng vẫn KHÔNG có quyền permissions:manage — quyền được cấp đúng phạm vi, không lan rộng.
      const stillForbiddenRes = await request(app.getHttpServer())
        .get('/api/v1/permissions')
        .set('Authorization', `Bearer ${limitedAdminToken}`);

      expect(stillForbiddenRes.status).toBe(403);
    },
  );

  it('admin không thể tự gỡ role cuối cùng / tự khoá tài khoản của chính mình (self-lockout)', async () => {
    const superAdmin = await userModel.findOne({ email: SUPER_ADMIN.email }).exec();

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/users/${superAdmin!.id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(409);
  });
});
