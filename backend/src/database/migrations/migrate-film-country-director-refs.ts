import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { CountriesService } from '../../countries/countries.service';
import { DirectorsService } from '../../directors/directors.service';
import { MigrateFilmCountryDirectorRefsModule } from './migrate-film-country-director-refs.module';

/**
 * Migration một lần (idempotent, an toàn chạy lại): chuyển `Film.country`/`Film.director` (chuỗi
 * tự do, có thể chứa nhiều tên phân tách bởi dấu phẩy, vd: "Việt Nam, Hàn Quốc") sang
 * `Film.countries`/`Film.directors` (ObjectId[] ref Country/Director) — resolve-or-create theo tên
 * qua CountriesService/DirectorsService.findOrCreateByName, vốn đã dedup theo slug (xử lý được cả
 * khác biệt hoa/thường lẫn dấu tiếng Việt nhờ `toSlug`, vd "Việt Nam" và "Viet Nam" khớp cùng slug
 * "viet-nam"). Thao tác trực tiếp qua driver Mongo thô (Connection.db) để đọc field `country`/
 * `director` cũ — Film schema hiện đã bỏ 2 field này nên Mongoose model sẽ không đọc được chúng.
 *
 * Đánh dấu "đã migrate" bằng sự tồn tại của field `countries` trên document — phim đã có field này
 * bị bỏ qua, nên script chạy lại nhiều lần không tạo dữ liệu trùng lặp.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigrateFilmCountryDirectorRefsModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const db = connection.db;
    if (!db) {
      throw new Error('Không lấy được kết nối MongoDB');
    }

    const countriesService = app.get(CountriesService);
    const directorsService = app.get(DirectorsService);
    const filmsCollection = db.collection('films');

    const cursor = filmsCollection.find({ countries: { $exists: false } });

    let processed = 0;
    let countryResolutions = 0;
    let directorResolutions = 0;

    while (await cursor.hasNext()) {
      const film = await cursor.next();
      if (!film) {
        continue;
      }

      const countryIds: Types.ObjectId[] = [];
      for (const name of splitNames(film.country)) {
        const country = await countriesService.findOrCreateByName(name);
        countryIds.push(country._id as Types.ObjectId);
        countryResolutions++;
      }

      const directorIds: Types.ObjectId[] = [];
      for (const name of splitNames(film.director)) {
        const director = await directorsService.findOrCreateByName(name);
        directorIds.push(director._id as Types.ObjectId);
        directorResolutions++;
      }

      await filmsCollection.updateOne(
        { _id: film._id },
        {
          $set: { countries: countryIds, directors: directorIds },
          $unset: { country: '', director: '' },
        },
      );
      processed++;
    }

    console.log(`Đã migrate ${processed} phim (country/director -> countries/directors refs).`);
    console.log(
      `Tổng lượt resolve: ${countryResolutions} country, ${directorResolutions} director.`,
    );
  } finally {
    await app.close();
  }
}

/** Tách chuỗi "A, B, C" thành danh sách tên đã trim, loại rỗng và trùng lặp chính xác trong 1 phim. */
function splitNames(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  );
}

bootstrap();
