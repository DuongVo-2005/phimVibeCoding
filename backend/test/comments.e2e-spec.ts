import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { Film, FilmDocument } from '../src/films/schemas/film.schema';
import { Comment, CommentDocument } from '../src/comments/schemas/comment.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let filmModel: Model<FilmDocument>;
  let commentModel: Model<CommentDocument>;
  let userModel: Model<UserDocument>;
  let userAToken: string;
  let userBToken: string;
  let adminToken: string;
  let filmId: string;

  const USER_A = { email: 'comments-user-a@e2e.test', password: 'Password123' };
  const USER_B = { email: 'comments-user-b@e2e.test', password: 'Password123' };
  const ADMIN = { email: 'comments-admin@e2e.test', password: 'Password123' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('rophim_comments_e2e');
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

    filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));
    commentModel = app.get<Model<CommentDocument>>(getModelToken(Comment.name));
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    const film = await filmModel.create({ slug: 'phim-binh-luan', title: 'Phim Bình Luận' });
    filmId = film._id.toString();

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER_A);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(USER_B);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ADMIN);
    await userModel.updateOne({ email: ADMIN.email }, { role: 'admin' });

    const loginA = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER_A);
    userAToken = loginA.body.data.accessToken;
    const loginB = await request(app.getHttpServer()).post('/api/v1/auth/login').send(USER_B);
    userBToken = loginB.body.data.accessToken;
    const loginAdmin = await request(app.getHttpServer()).post('/api/v1/auth/login').send(ADMIN);
    adminToken = loginAdmin.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Auth guard — chỉ dùng JWT hiện có; @Roles(ADMIN) cho 2 route mới moderation', () => {
    it('POST /comments không có token -> 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .send({ film: filmId, content: 'test' });
      expect(res.status).toBe(401);
    });

    it('GET /comments (moderation feed) không có token -> 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/comments');
      expect(res.status).toBe(401);
    });

    it('GET /comments (moderation feed) với token user thường -> 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('content rỗng -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: filmId, content: '' });
      expect(res.status).toBe(400);
    });

    it('content vượt quá 2000 ký tự -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: filmId, content: 'a'.repeat(2001) });
      expect(res.status).toBe(400);
    });

    it('film không phải ObjectId hợp lệ -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: 'khong-hop-le', content: 'test' });
      expect(res.status).toBe(400);
    });
  });

  let rootCommentId: string;

  describe('Tạo bình luận + denormalized commentCount', () => {
    it('POST /comments tạo bình luận gốc, tăng Film.commentCount', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: filmId, content: 'Phim hay quá!' });

      expect(res.status).toBe(201);
      rootCommentId = res.body.data.id ?? res.body.data._id;

      const film = await filmModel.findById(filmId).exec();
      expect(film?.commentCount).toBe(1);
    });

    it('GET /comments/film/:filmId (Public) trả về bình luận vừa tạo', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/comments/film/${filmId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((c: any) => c.content === 'Phim hay quá!')).toBe(true);
    });
  });

  describe('Reply — validate parent (tồn tại, cùng phim, chỉ nested 1 cấp)', () => {
    it('reply vào parent không tồn tại -> 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: filmId, content: 'reply', parent: '65f1a2b3c4d5e6f7a8b9c0ff' });
      expect(res.status).toBe(404);
    });

    it('reply với parent thuộc phim khác -> 400', async () => {
      const otherFilm = await filmModel.create({ slug: 'phim-khac', title: 'Phim Khác' });
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: otherFilm._id.toString(), content: 'reply sai phim', parent: rootCommentId });
      expect(res.status).toBe(400);
    });

    let replyId: string;

    it('reply hợp lệ (cùng phim, parent là comment gốc) -> 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ film: filmId, content: 'Đồng ý!', parent: rootCommentId });
      expect(res.status).toBe(201);
      replyId = res.body.data.id ?? res.body.data._id;
    });

    it('GET /comments/:id/replies trả về đúng reply', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/comments/${rootCommentId}/replies`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((c: any) => c.content === 'Đồng ý!')).toBe(true);
    });

    it('reply vào một reply (nested 2 cấp) -> 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ film: filmId, content: 'reply của reply', parent: replyId });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /comments/:id/vote — xác minh hành vi idempotent-toggle (nghi vấn bug ObjectId cast)', () => {
    it('User B vote UP lần 1 -> upVoteCount = 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/comments/${rootCommentId}/vote`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(201);
      expect(res.body.data.upVoteCount).toBe(1);
    });

    it('User B vote UP lần 2 (cùng loại) -> phải TOGGLE OFF, upVoteCount = 0 (không được lỗi 500)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/comments/${rootCommentId}/vote`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(201);
      expect(res.body.data.upVoteCount).toBe(0);
    });

    it('User B vote UP lần 3 -> vote lại được, upVoteCount = 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/comments/${rootCommentId}/vote`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(201);
      expect(res.body.data.upVoteCount).toBe(1);
    });

    it('User B đổi sang vote DOWN -> upVoteCount = 0, downVoteCount = 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/comments/${rootCommentId}/vote`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ voteType: 'down' });

      expect(res.status).toBe(201);
      expect(res.body.data.upVoteCount).toBe(0);
      expect(res.body.data.downVoteCount).toBe(1);
    });
  });

  describe('GET /comments/top-voted, /comments/latest', () => {
    it('top-voted trả về danh sách không lỗi', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/comments/top-voted?limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('latest trả về danh sách không lỗi', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/comments/latest?limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /comments/:id — owner-only, cửa sổ 15 phút', () => {
    it('không phải chủ bình luận -> 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${rootCommentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ content: 'Sửa trộm' });
      expect(res.status).toBe(403);
    });

    it('chủ bình luận sửa trong vòng 15 phút -> 200, content cập nhật, isEdited:true', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${rootCommentId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ content: 'Phim hay quá! (đã chỉnh sửa)' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Phim hay quá! (đã chỉnh sửa)');
      expect(res.body.data.isEdited).toBe(true);
    });

    it('quá 15 phút kể từ khi tạo -> 409', async () => {
      const oldComment = await commentModel.create({
        film: filmId,
        user: (await userModel.findOne({ email: USER_A.email }).exec())!._id,
        content: 'Bình luận cũ',
      });
      // Mongoose's `timestamps:true` plugin bảo vệ `createdAt` khỏi bị ghi đè qua document.save()
      // (chỉ set 1 lần lúc insert) — phải dùng driver Mongo thô (bỏ qua middleware Mongoose) để
      // giả lập một bình luận cũ trong test.
      const backdatedTo = new Date(Date.now() - 16 * 60 * 1000);
      await commentModel.collection.updateOne(
        { _id: oldComment._id },
        { $set: { createdAt: backdatedTo } },
      );

      const reread = await commentModel.findById(oldComment._id).exec();
      expect(reread?.createdAt?.getTime()).toBe(backdatedTo.getTime());

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${oldComment._id.toString()}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ content: 'Sửa quá hạn' });

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /comments/:id/visibility — Admin-only, soft-moderation', () => {
    it('user thường gọi -> 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${rootCommentId}/visibility`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ isHidden: true });
      expect(res.status).toBe(403);
    });

    it('Admin ẩn bình luận -> biến mất khỏi listing công khai nhưng vẫn còn trong moderation feed', async () => {
      const hideRes = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${rootCommentId}/visibility`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isHidden: true });
      expect(hideRes.status).toBe(200);
      expect(hideRes.body.data.isHidden).toBe(true);

      const listing = await request(app.getHttpServer()).get(`/api/v1/comments/film/${filmId}`);
      expect(listing.body.data.items.some((c: any) => c._id === rootCommentId)).toBe(false);

      const moderationFeed = await request(app.getHttpServer())
        .get(`/api/v1/comments?filmId=${filmId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(moderationFeed.status).toBe(200);
      expect(
        moderationFeed.body.data.items.some((c: any) => (c.id ?? c._id) === rootCommentId),
      ).toBe(true);
    });

    it('vote/upVoteCount không bị reset khi ẩn (giữ nguyên số liệu)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/comments?filmId=${filmId}`,
      ).set('Authorization', `Bearer ${adminToken}`);
      const hidden = res.body.data.items.find((c: any) => (c.id ?? c._id) === rootCommentId);
      expect(hidden.downVoteCount).toBe(1);
    });

    it('Admin hiện lại bình luận -> xuất hiện lại trong listing công khai', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${rootCommentId}/visibility`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isHidden: false });
      expect(res.status).toBe(200);

      const listing = await request(app.getHttpServer()).get(`/api/v1/comments/film/${filmId}`);
      expect(listing.body.data.items.some((c: any) => (c.id ?? c._id) === rootCommentId)).toBe(
        true,
      );
    });
  });

  describe('GET /comments (moderation feed) — filter filmId/userId', () => {
    it('lọc theo filmId trả về đúng số lượng bình luận của phim đó', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/comments?filmId=${filmId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(
        res.body.data.items.every((c: any) => (c.film?.id ?? c.film?._id ?? c.film) === filmId),
      ).toBe(true);
    });
  });

  describe('DELETE /comments/:id — owner-or-admin (hành vi đã có từ trước)', () => {
    let toDeleteId: string;

    it('setup: tạo bình luận mới để test xoá', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ film: filmId, content: 'Sẽ bị xoá' });
      toDeleteId = res.body.data.id ?? res.body.data._id;
    });

    it('user khác (không phải chủ, không phải admin) xoá -> 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/comments/${toDeleteId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(403);
    });

    it('admin xoá được dù không phải chủ -> 200, Film.commentCount giảm', async () => {
      const before = await filmModel.findById(filmId).exec();
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/comments/${toDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const after = await filmModel.findById(filmId).exec();
      expect(after!.commentCount).toBe(before!.commentCount - 1);
    });
  });
});
