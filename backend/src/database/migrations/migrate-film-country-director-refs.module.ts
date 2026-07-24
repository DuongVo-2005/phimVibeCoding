import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { CountriesModule } from '../../countries/countries.module';
import { DirectorsModule } from '../../directors/directors.module';
import { DatabaseModule } from '../database.module';

// Import CountriesModule/DirectorsModule trực tiếp (khác với migration Phase 3) vì script này CẦN
// CountriesService/DirectorsService.findOrCreateByName để resolve-or-create theo tên (dedup theo
// slug, xử lý cả khác biệt hoa/thường lẫn dấu tiếng Việt) — không giống migration types->categories
// (chỉ đổi tên collection, cố tình tránh Mongoose model để không tự tạo collection rỗng). Ở đây
// countries/directors collection có tồn tại sẵn (rỗng hay không) không ảnh hưởng gì tới thao tác
// (không có bước "rename" cần kiểm tra tồn tại trước).
@Module({
  imports: [ConfigModule, DatabaseModule, CountriesModule, DirectorsModule],
})
export class MigrateFilmCountryDirectorRefsModule {}
