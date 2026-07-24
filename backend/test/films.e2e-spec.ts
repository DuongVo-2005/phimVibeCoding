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

describe('Films — relationship refs + API stabilization (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let filmModel: Model<FilmDocument>;
  let adminToken: string;

  const ADMIN = { email: 'films-admin@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_films_e2e');
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
    filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const permissionModel = app.get<Model<PermissionDocument>>(getModelToken(Permission.name));
    const rolePermissionModel = app.get<Model<RolePermissionDocument>>(
      getModelToken(RolePermission.name),
    );

    // Films controller (Phase 4.5) giờ gate mutation routes bằng CẢ @Roles(ADMIN) LẪN
    // @RequirePermission('films:*') — cùng pattern với Categories/Countries/Directors. Cần seed đủ
    // permission cho role test này, cộng thêm categories:create để dựng dữ liệu test filter.
    const permissions = await permissionModel.insertMany(
      [
        'films:create',
        'films:update',
        'films:delete',
        'categories:create',
        'countries:create',
        'directors:create',
      ].map((key) => ({
        key,
        resource: key.split(':')[0],
        action: key.split(':')[1],
      })),
    );
    const role = await roleModel.create({ name: 'films-e2e-admin', isSystem: false });
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

  let countryId: string;
  let directorId: string;
  let categoryId: string;
  let filmSlug: string;
  let filmId: string;

  describe('Country/Director relationship refs', () => {
    it('setup: tạo Country + Director + Category dùng làm ref cho phim', async () => {
      const country = await request(app.getHttpServer())
        .post('/api/v1/countries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Hàn Quốc' });
      expect(country.status).toBe(201);
      countryId = country.body.data.id ?? country.body.data._id;

      const director = await request(app.getHttpServer())
        .post('/api/v1/directors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bong Joon-ho' });
      expect(director.status).toBe(201);
      directorId = director.body.data.id ?? director.body.data._id;

      const category = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Tâm Lý' });
      expect(category.status).toBe(201);
      categoryId = category.body.data.id ?? category.body.data._id;
    });

    it('POST /films tạo phim với countries/directors/categories là mảng ObjectId (cần films:create + Roles ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Ký Sinh Trùng',
          countries: [countryId],
          directors: [directorId],
          categories: [categoryId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.countries).toEqual([countryId]);
      expect(res.body.data.directors).toEqual([directorId]);
      expect(res.body.data.categories).toEqual([categoryId]);
      expect(res.body.data.isPublished).toBe(true);
      filmSlug = res.body.data.slug;
      filmId = res.body.data.id ?? res.body.data._id;
    });

    it('POST /films từ chối country/director/type dạng chuỗi cũ (đã đổi shape, không backward compat ở tầng DTO)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phim Khác', country: 'Hàn Quốc', director: 'Ai đó', types: [categoryId] });

      expect(res.status).toBe(400);
    });

    it('GET /films/:slug populate countries/directors/categories thành object {name,slug}', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/films/${filmSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.countries[0]).toMatchObject({ name: 'Hàn Quốc', slug: 'han-quoc' });
      expect(res.body.data.directors[0]).toMatchObject({ name: 'Bong Joon-ho' });
      expect(res.body.data.categories[0]).toMatchObject({ name: 'Tâm Lý', slug: 'tam-ly' });
    });

    it('GET /films?country=slug lọc đúng theo quốc gia', async () => {
      const match = await request(app.getHttpServer()).get('/api/v1/films?country=han-quoc');
      expect(match.status).toBe(200);
      expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);

      const noMatch = await request(app.getHttpServer()).get(
        '/api/v1/films?country=khong-ton-tai',
      );
      expect(noMatch.body.data.items).toHaveLength(0);
    });

    it('GET /films?director=slug lọc đúng theo đạo diễn', async () => {
      const match = await request(app.getHttpServer()).get('/api/v1/films?director=bong-joon-ho');
      expect(match.status).toBe(200);
      expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);

      const noMatch = await request(app.getHttpServer()).get(
        '/api/v1/films?director=khong-ton-tai',
      );
      expect(noMatch.body.data.items).toHaveLength(0);
    });

    it('GET /films?category=slug lọc đúng theo thể loại (tên tham số mới)', async () => {
      const match = await request(app.getHttpServer()).get('/api/v1/films?category=tam-ly');
      expect(match.status).toBe(200);
      expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);
    });

    it('GET /films?type=slug vẫn hoạt động (alias tương thích ngược của category)', async () => {
      const match = await request(app.getHttpServer()).get('/api/v1/films?type=tam-ly');
      expect(match.status).toBe(200);
      expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);
    });

    it('PATCH /films/:id cập nhật lại countries/directors', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/films/${filmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ countries: [], directors: [] });

      expect(res.status).toBe(200);
      expect(res.body.data.countries).toEqual([]);
      expect(res.body.data.directors).toEqual([]);
    });
  });

  describe('isPublished — soft-hide moderation', () => {
    let hiddenSlug: string;
    let hiddenId: string;

    it('setup: tạo phim ẩn (isPublished:false)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phim Chưa Duyệt', isPublished: false });

      expect(res.status).toBe(201);
      expect(res.body.data.isPublished).toBe(false);
      hiddenSlug = res.body.data.slug;
      hiddenId = res.body.data.id ?? res.body.data._id;
    });

    it('GET /films (công khai, không token) không trả về phim ẩn', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/films?limit=100');
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((f: any) => f.slug === hiddenSlug)).toBe(false);
    });

    it('GET /films/:slug (công khai) trả 404 cho phim ẩn', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/films/${hiddenSlug}`);
      expect(res.status).toBe(404);
    });

    it('GET /films?isPublished=... từ người dùng không phải Admin (không token) bị từ chối 400', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/films?isPublished=false');
      expect(res.status).toBe(400);
    });

    it('GET /films?isPublished=false với token Admin trả về đúng phim ẩn', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/films?isPublished=false&limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((f: any) => f.slug === hiddenSlug)).toBe(true);
    });

    it('GET /films không truyền isPublished với token Admin thấy cả phim công khai lẫn phim ẩn', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/films?limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((f: any) => f.slug === hiddenSlug)).toBe(true);
      expect(res.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);
    });

    it('PATCH /films/:id isPublished:true công khai lại phim', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/films/${hiddenId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: true });
      expect(res.status).toBe(200);
      expect(res.body.data.isPublished).toBe(true);

      const publicRes = await request(app.getHttpServer()).get(`/api/v1/films/${hiddenSlug}`);
      expect(publicRes.status).toBe(200);
    });
  });

  describe('GET /films/top — metric', () => {
    let lowViewHighRatingSlug: string;
    let highViewLowRatingSlug: string;

    it('setup: 2 phim — một view cao/rating thấp, một view thấp/rating cao', async () => {
      const a = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phim View Cao' });
      const b = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phim Rating Cao' });

      highViewLowRatingSlug = a.body.data.slug;
      lowViewHighRatingSlug = b.body.data.slug;

      await filmModel.updateOne(
        { slug: highViewLowRatingSlug },
        { view: 1000, ratingAvg: 5, ratingCount: 1 },
      );
      await filmModel.updateOne(
        { slug: lowViewHighRatingSlug },
        { view: 1, ratingAvg: 9.5, ratingCount: 10 },
      );
    });

    it('mặc định (metric=view) — phim view cao đứng trước', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/films/top?limit=50');
      expect(res.status).toBe(200);
      const slugs = res.body.data.map((f: any) => f.slug);
      expect(slugs.indexOf(highViewLowRatingSlug)).toBeLessThan(
        slugs.indexOf(lowViewHighRatingSlug),
      );
    });

    it('metric=ratingAvg — phim rating cao đứng trước', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/films/top?limit=50&metric=ratingAvg',
      );
      expect(res.status).toBe(200);
      const slugs = res.body.data.map((f: any) => f.slug);
      expect(slugs.indexOf(lowViewHighRatingSlug)).toBeLessThan(
        slugs.indexOf(highViewLowRatingSlug),
      );
    });

    it('metric không hợp lệ -> âm thầm dùng mặc định view, không lỗi', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/films/top?limit=50&metric=khong-hop-le',
      );
      expect(res.status).toBe(200);
    });
  });

  describe('GET /films/most-commented', () => {
    it('sort theo commentCount desc, không bị route :slug nuốt mất', async () => {
      await filmModel.updateOne({ slug: filmSlug }, { commentCount: 42 });

      const res = await request(app.getHttpServer()).get('/api/v1/films/most-commented?limit=10');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].slug).toBe(filmSlug);
    });

    it('không trả về phim ẩn (isPublished:false)', async () => {
      const hidden = await request(app.getHttpServer())
        .post('/api/v1/films')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phim Ẩn Bình Luận Nhiều', isPublished: false });
      await filmModel.updateOne({ slug: hidden.body.data.slug }, { commentCount: 999 });

      const res = await request(app.getHttpServer()).get('/api/v1/films/most-commented?limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.some((f: any) => f.slug === hidden.body.data.slug)).toBe(false);
    });
  });

  describe('Permission gate trên Films admin routes', () => {
    it('POST /films không token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/films')
        .send({ title: 'Không được phép' });
      expect(res.status).toBe(401);
    });
  });
});
