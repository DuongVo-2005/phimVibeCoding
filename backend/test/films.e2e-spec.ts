import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { Permission, PermissionDocument } from '../src/permissions/schemas/permission.schema';
import {
  RolePermission,
  RolePermissionDocument,
} from '../src/role-permissions/schemas/role-permission.schema';
import { Role, RoleDocument } from '../src/roles/schemas/role.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Films — country/director relationship refactor (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;
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

    // Films controller chỉ gate bằng @Roles(ADMIN) (chưa có @RequirePermission ở phase này), nhưng
    // Countries/Directors controller (dùng để tạo ref cho phim) đã có PermissionsGuard từ Phase 3.
    const permissions = await permissionModel.insertMany(
      ['countries:create', 'directors:create'].map((key) => ({
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
  let filmSlug: string;

  it('setup: tạo Country + Director dùng làm ref cho phim', async () => {
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
  });

  it('POST /films tạo phim với countries/directors là mảng ObjectId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/films')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Ký Sinh Trùng',
        countries: [countryId],
        directors: [directorId],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.countries).toEqual([countryId]);
    expect(res.body.data.directors).toEqual([directorId]);
    filmSlug = res.body.data.slug;
  });

  it('POST /films từ chối country/director dạng chuỗi cũ (đã đổi shape, không backward compat ở tầng DTO)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/films')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Phim Khác', country: 'Hàn Quốc', director: 'Ai đó' });

    expect(res.status).toBe(400);
  });

  it('GET /films/:slug populate countries/directors thành object {name,slug}', async () => {
    const res = await request(app.getHttpServer()).get(`/api/v1/films/${filmSlug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.countries[0]).toMatchObject({ name: 'Hàn Quốc', slug: 'han-quoc' });
    expect(res.body.data.directors[0]).toMatchObject({ name: 'Bong Joon-ho' });
  });

  it('GET /films?country=slug lọc đúng theo quốc gia', async () => {
    const match = await request(app.getHttpServer()).get('/api/v1/films?country=han-quoc');
    expect(match.status).toBe(200);
    expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);

    const noMatch = await request(app.getHttpServer()).get('/api/v1/films?country=khong-ton-tai');
    expect(noMatch.body.data.items).toHaveLength(0);
  });

  it('GET /films?director=slug lọc đúng theo đạo diễn', async () => {
    const match = await request(app.getHttpServer()).get('/api/v1/films?director=bong-joon-ho');
    expect(match.status).toBe(200);
    expect(match.body.data.items.some((f: any) => f.slug === filmSlug)).toBe(true);

    const noMatch = await request(app.getHttpServer()).get('/api/v1/films?director=khong-ton-tai');
    expect(noMatch.body.data.items).toHaveLength(0);
  });

  it('PATCH /films/:id cập nhật lại countries/directors', async () => {
    const filmsRes = await request(app.getHttpServer()).get(`/api/v1/films/${filmSlug}`);
    const filmId = filmsRes.body.data.id ?? filmsRes.body.data._id;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/films/${filmId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ countries: [], directors: [] });

    expect(res.status).toBe(200);
    expect(res.body.data.countries).toEqual([]);
    expect(res.body.data.directors).toEqual([]);
  });
});
