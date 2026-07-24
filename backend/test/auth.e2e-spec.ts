import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;

  const ACTIVE_USER = {
    email: 'phase1-active@example.com',
    password: 'Password123',
    name: 'Phase1 Active User',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_e2e');
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
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('GET /api/v1/health vẫn hoạt động bình thường (smoke test — không có API nào khác bị ảnh hưởng)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/auth/register tạo tài khoản mới thành công', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(ACTIVE_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(ACTIVE_USER.email);
  });

  it('POST /api/v1/auth/register từ chối password ngắn hơn 8 ký tự', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: 'short-password@example.com',
      password: 'short1',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login đăng nhập thành công với tài khoản active', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ACTIVE_USER.email,
      password: ACTIVE_USER.password,
    });

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
  });

  it('POST /api/v1/auth/login trả về 401 khi sai mật khẩu', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ACTIVE_USER.email,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login trả về 401 khi email không tồn tại', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'khong-ton-tai@example.com',
      password: ACTIVE_USER.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login trả về 403 (không phải 401) khi tài khoản bị vô hiệu hoá', async () => {
    await userModel.updateOne({ email: ACTIVE_USER.email }, { isActive: false }).exec();

    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ACTIVE_USER.email,
      password: ACTIVE_USER.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Tài khoản đã bị vô hiệu hoá');

    await userModel.updateOne({ email: ACTIVE_USER.email }, { isActive: true }).exec();
  });
});
