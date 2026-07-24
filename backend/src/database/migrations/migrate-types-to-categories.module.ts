import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../database.module';

// Cố ý KHÔNG import CategoriesModule ở đây: đăng ký Category schema qua MongooseModule.forFeature
// sẽ khiến Mongoose tự đồng bộ index (autoIndex mặc định true) và tạo sẵn collection "categories"
// rỗng chỉ bằng việc khởi tạo module — trước cả khi bước kiểm tra "categories đã tồn tại chưa"
// trong migration kịp chạy, khiến việc rename luôn thất bại (target namespace exists). Vì vậy
// script này thao tác trực tiếp qua driver Mongo thô (Connection.db), không qua Mongoose model.
@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class MigrateTypesToCategoriesModule {}
