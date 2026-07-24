import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MigrateFilmsCategoriesPublishedModule } from './migrate-films-categories-published.module';

/**
 * Migration một lần (idempotent, an toàn chạy lại) cho Phase 4.5 — API Stabilization:
 * 1. Đổi tên field `Film.types` -> `Film.categories` (rename tại chỗ, không mất dữ liệu/giữ
 *    nguyên _id — field đã đổi tên trong code từ Phase 4.5, dữ liệu cũ trong Mongo vẫn còn tên cũ
 *    cho tới khi script này chạy).
 * 2. Backfill `isPublished:true` cho mọi phim chưa có field này — bắt buộc vì Mongoose chỉ áp
 *    `default` khi hydrate trong bộ nhớ, KHÔNG ghi giá trị mặc định xuống MongoDB, nên
 *    `find({isPublished:true})` (bộ lọc ngầm định cho mọi API công khai) sẽ bỏ sót toàn bộ phim cũ
 *    nếu không backfill tường minh (cùng bài học đã gặp ở migrate-types-to-categories.ts).
 *
 * Thao tác trực tiếp qua driver Mongo thô (Connection.db), không qua Mongoose Film model.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigrateFilmsCategoriesPublishedModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const db = connection.db;
    if (!db) {
      throw new Error('Không lấy được kết nối MongoDB');
    }

    const filmsCollection = db.collection('films');

    const renameResult = await filmsCollection.updateMany(
      { types: { $exists: true } },
      { $rename: { types: 'categories' } },
    );
    console.log(`Đã đổi tên field "types" -> "categories" cho ${renameResult.modifiedCount} phim.`);

    const backfillResult = await filmsCollection.updateMany(
      { isPublished: { $exists: false } },
      { $set: { isPublished: true } },
    );
    console.log(`Đã backfill isPublished=true cho ${backfillResult.modifiedCount} phim.`);
  } finally {
    await app.close();
  }
}

bootstrap();
