import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { Film, FilmDocument } from '../src/films/schemas/film.schema';
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Taxonomy (Categories/Countries/Directors) (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let filmModel: Model<FilmDocument>;
  let adminToken: string;

  const ADMIN = { email: 'taxonomy-admin@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_taxonomy_e2e');
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
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    const permissions = await permissionModel.insertMany(
      [
        'categories:create',
        'categories:update',
        'categories:delete',
        'countries:create',
        'countries:update',
        'countries:delete',
        'directors:create',
        'directors:update',
        'directors:delete',
      ].map((key) => ({ key, resource: key.split(':')[0], action: key.split(':')[1] })),
    );
    const role = await roleModel.create({ name: 'taxonomy-admin', isSystem: false });
    await rolePermissionModel.insertMany(
      permissions.map((permission) => ({ role: role._id, permission: permission._id })),
    );

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await userModel.updateOne({ email: ADMIN.email }, { role: 'admin', roleIds: [role._id] });

    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send(ADMIN);
    adminToken = login.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Categories', () => {
    let categoryId: string;

    it('POST /categories tạo danh mục mới', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Hành Động' });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('hanh-dong');
      expect(res.body.data.isActive).toBe(true);
      categoryId = res.body.data.id ?? res.body.data._id;
    });

    it('GET /categories (public) trả về danh mục vừa tạo (mặc định isActive=true)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.data.some((c: any) => c.slug === 'hanh-dong')).toBe(true);
    });

    it('GET /categories/hot chưa có gì (isHot mặc định false)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/categories/hot');
      expect(res.body.data).toHaveLength(0);
    });

    it('GET /categories/:slug trả về đúng danh mục, 404 nếu không tồn tại', async () => {
      const ok = await request(app.getHttpServer()).get('/api/v1/categories/hanh-dong');
      expect(ok.status).toBe(200);

      const notFound = await request(app.getHttpServer()).get('/api/v1/categories/khong-ton-tai');
      expect(notFound.status).toBe(404);
    });

    it('PATCH /categories/:id đổi isHot=true -> xuất hiện trong /categories/hot', async () => {
      const patch = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isHot: true });
      expect(patch.status).toBe(200);

      const hot = await request(app.getHttpServer()).get('/api/v1/categories/hot');
      expect(hot.body.data.some((c: any) => c.slug === 'hanh-dong')).toBe(true);
    });

    it('PATCH /categories/:id đổi name KHÔNG làm đổi slug (khác Actors/Directors/Countries)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Hành Động (Cập Nhật)' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Hành Động (Cập Nhật)');
      expect(res.body.data.slug).toBe('hanh-dong');
    });

    it('DELETE /categories/:id bị chặn (409) khi còn phim tham chiếu tới danh mục', async () => {
      // Ép kiểu tường minh sang ObjectId — Model.create() không tự cast string bên trong mảng
      // [Types.ObjectId] một cách đáng tin cậy ở phiên bản Mongoose này (cùng loại vấn đề gặp
      // phải với insertMany() ở Phase 2 — xem RolePermissionsService).
      const film = await filmModel.create({
        slug: 'phim-test-hanh-dong',
        title: 'Phim Test',
        categories: [new Types.ObjectId(categoryId)],
      });

      const blocked = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(blocked.status).toBe(409);

      await filmModel.findByIdAndDelete(film._id).exec();

      const allowed = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(allowed.status).toBe(200);
    });

    it('POST /categories từ chối tên rỗng (validation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Countries', () => {
    let countryId: string;

    it('full CRUD round-trip', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/countries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Hàn Quốc', code: 'KR' });
      expect(create.status).toBe(201);
      countryId = create.body.data.id ?? create.body.data._id;

      const list = await request(app.getHttpServer()).get('/api/v1/countries');
      expect(list.body.data.some((c: any) => c.slug === 'han-quoc')).toBe(true);

      const detail = await request(app.getHttpServer()).get('/api/v1/countries/han-quoc');
      expect(detail.status).toBe(200);

      const update = await request(app.getHttpServer())
        .patch(`/api/v1/countries/${countryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'KOR' });
      expect(update.status).toBe(200);
      expect(update.body.data.code).toBe('KOR');

      const del = await request(app.getHttpServer())
        .delete(`/api/v1/countries/${countryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(del.status).toBe(200);
    });

    it('POST /countries yêu cầu quyền admin — 401 nếu không có token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/countries')
        .send({ name: 'Nhật Bản' });
      expect(res.status).toBe(401);
    });
  });

  describe('Directors', () => {
    let directorId: string;

    it('full CRUD round-trip', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/directors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Vương Gia Vệ', nationality: 'Hồng Kông' });
      expect(create.status).toBe(201);
      directorId = create.body.data.id ?? create.body.data._id;

      const list = await request(app.getHttpServer()).get('/api/v1/directors?search=Vương');
      expect(list.status).toBe(200);
      expect(list.body.data.items.some((d: any) => d.slug === 'vuong-gia-ve')).toBe(true);

      const detail = await request(app.getHttpServer()).get('/api/v1/directors/vuong-gia-ve');
      expect(detail.status).toBe(200);

      const update = await request(app.getHttpServer())
        .patch(`/api/v1/directors/${directorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bio: 'Đạo diễn nổi tiếng' });
      expect(update.status).toBe(200);
      expect(update.body.data.bio).toBe('Đạo diễn nổi tiếng');

      const del = await request(app.getHttpServer())
        .delete(`/api/v1/directors/${directorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(del.status).toBe(200);
    });
  });
});
