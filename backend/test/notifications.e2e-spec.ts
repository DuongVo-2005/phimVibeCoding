import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NotificationType } from '../src/common/constants';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';
import { NotificationsService } from '../src/notifications/notifications.service';
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';

describe('Notifications (e2e) — Phase 34', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let notificationsService: NotificationsService;
  let userAToken: string;
  let userAId: string;
  let userBToken: string;

  const USER_A = { email: 'notifications-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'notifications-user-b@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_notifications_e2e');
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

    notificationsService = app.get(NotificationsService);

    // DB in-memory không tự chạy `seed-rbac.ts` (chỉ chạy thủ công ở môi trường thật) — user đăng
    // ký trong test này sẽ có `roleIds` rỗng trừ khi role "user" đã tồn tại SẴN trước khi gọi
    // register (`UsersService.create()` -> `getDefaultRoleIds()` -> `rolesService.findByName
    // ('user')`). Không seed role kèm `notifications:read`/`notifications:manage` thì mọi route
    // `@RequirePermission()` của module này sẽ 403 với TẤT CẢ user, kể cả chủ sở hữu — cùng pattern
    // đã áp dụng ở `users-admin.e2e-spec.ts`.
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    const permRead = await permissionModel.create({
      key: 'notifications:read',
      resource: 'notifications',
      action: 'read',
    });
    const permManage = await permissionModel.create({
      key: 'notifications:manage',
      resource: 'notifications',
      action: 'manage',
    });
    const userRole = await roleModel.create({ name: 'user', isSystem: true });
    await rolePermissionModel.create({ role: userRole._id, permission: permRead._id });
    await rolePermissionModel.create({ role: userRole._id, permission: permManage._id });

    const registerA = await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER_A);
    userAId = registerA.body.data.user.id;
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

  describe('Auth guard', () => {
    it('GET /notifications không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('PATCH /notifications/read-all không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).patch('/api/v1/notifications/read-all');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications — rỗng ban đầu', () => {
    it('trả về items rỗng, unreadCount=0 khi user chưa có thông báo nào', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.meta.totalItems).toBe(0);
      expect(res.body.data.unreadCount).toBe(0);
    });
  });

  describe('GET /notifications — phân trang + newest first + unreadCount', () => {
    let ids: string[] = [];

    beforeAll(async () => {
      // Seed qua NotificationsService THẬT (không ghi thẳng MongoDB) — tuần tự để đảm bảo thứ tự
      // createdAt xác định, kiểm tra đúng "newest first".
      ids = [];
      for (let i = 1; i <= 5; i += 1) {
        const notification = await notificationsService.create(
          userAId,
          NotificationType.SYSTEM,
          `Thông báo ${i}`,
          `Nội dung ${i}`,
        );
        ids.push((notification._id as { toString(): string }).toString());
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    });

    it('trang 1 (limit=2) trả về 2 item MỚI NHẤT trước, meta đúng, unreadCount=5', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].title).toBe('Thông báo 5');
      expect(res.body.data.items[1].title).toBe('Thông báo 4');
      expect(res.body.data.meta).toEqual({ page: 1, limit: 2, totalItems: 5, totalPages: 3 });
      expect(res.body.data.unreadCount).toBe(5);
    });

    it('trang cuối (page=3, limit=2) chỉ còn 1 item (Thông báo 1)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications?page=3&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].title).toBe('Thông báo 1');
    });

    it('User B (chưa có thông báo) KHÔNG thấy thông báo của User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('PATCH /notifications/:id/read đánh dấu đúng 1 thông báo, unreadCount giảm còn 4', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${ids[0]}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.data.unreadCount).toBe(4);
    });

    it('User B PATCH thông báo của User A -> 404 (không lộ thông tin, không phải 403)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${ids[1]}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('GET /notifications?isRead=true chỉ trả về thông báo đã đọc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications?isRead=true')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]._id).toBe(ids[0]);
    });

    it('PATCH /notifications/read-all đánh dấu TOÀN BỘ còn lại đã đọc, unreadCount=0', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(4);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.data.unreadCount).toBe(0);
    });

    it('User B DELETE thông báo của User A -> 404, thông báo vẫn còn nguyên', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/notifications/${ids[2]}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(deleteRes.status).toBe(404);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.data.meta.totalItems).toBe(5);
    });

    it('DELETE /notifications/:id (đúng chủ) -> xoá thành công, totalItems giảm còn 4', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/notifications/${ids[2]}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(deleteRes.status).toBe(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(listRes.body.data.meta.totalItems).toBe(4);
    });
  });
});
