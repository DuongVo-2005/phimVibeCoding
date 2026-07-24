import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MigrateTypesToCategoriesModule } from './migrate-types-to-categories.module';

/**
 * Migration một lần (idempotent, an toàn chạy lại): đổi tên collection `types` -> `categories`
 * (giữ nguyên _id và toàn bộ document, không copy/mất dữ liệu), sau đó backfill `isActive:true`
 * cho các document cũ chưa có field này — bắt buộc vì Mongoose chỉ áp `default` khi hydrate
 * trong bộ nhớ, KHÔNG ghi giá trị mặc định xuống MongoDB, nên `find({isActive:true})` sẽ bỏ sót
 * các document renamed nếu không backfill tường minh.
 *
 * Thao tác trực tiếp qua driver Mongo thô (không qua CategoriesModule/Mongoose model) — xem
 * migrate-types-to-categories.module.ts để biết lý do.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigrateTypesToCategoriesModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const db = connection.db;
    if (!db) {
      throw new Error('Không lấy được kết nối MongoDB');
    }

    const collectionNames = (await db.listCollections().toArray()).map((c) => c.name);

    if (collectionNames.includes('categories')) {
      console.log('Collection "categories" đã tồn tại — bỏ qua bước đổi tên.');
    } else if (collectionNames.includes('types')) {
      await db.collection('types').rename('categories');
      console.log('Đã đổi tên collection "types" -> "categories".');
    } else {
      console.log('Không tìm thấy collection "types" hoặc "categories" — không có gì để đổi tên.');
    }

    const result = await db
      .collection('categories')
      .updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
    console.log(`Đã backfill isActive=true cho ${result.modifiedCount} danh mục.`);
  } finally {
    await app.close();
  }
}

bootstrap();
