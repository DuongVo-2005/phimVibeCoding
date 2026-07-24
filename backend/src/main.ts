import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { FILM_TEXT_INDEX_LANGUAGE_OVERRIDE, Film, FilmDocument } from './films/schemas/film.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app')!;

  if (appConfig.nodeEnv === 'development') {
    await syncDevelopmentIndexes(app);
  }

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: appConfig.corsOrigin === '*' ? true : appConfig.corsOrigin.split(','),
    credentials: true,
  });

  app.setGlobalPrefix(appConfig.apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rophim API')
    .setDescription('Backend API cho website xem phim (RoPhim clone)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(appConfig.port);
  // eslint-disable-next-line no-console
  console.log(`🚀 RoPhim API is running on: http://localhost:${appConfig.port}/${appConfig.apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs: http://localhost:${appConfig.port}/api/docs`);
}

/**
 * Development only: đồng bộ lại index của Film theo đúng định nghĩa schema hiện tại.
 *
 * Lưu ý: Mongoose's `syncIndexes()` không phát hiện thay đổi `language_override` trên text
 * index (nó chỉ so sánh `weights`/`default_language` cho text index — xem
 * mongoose/lib/helpers/indexes/isIndexEqual.js), nên nếu chỉ gọi syncIndexes() thì index text
 * cũ (thiếu language_override đúng) sẽ không được recreate. Phải tự phát hiện + drop index text
 * lỗi thời trước, rồi syncIndexes() mới tạo lại đúng theo schema.
 *
 * Không chạy ở production: syncIndexes có thể drop index đang dùng và tốn thời gian trên
 * collection lớn; ở production nên chạy migration index thủ công, có kiểm soát.
 */
async function syncDevelopmentIndexes(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  try {
    const filmModel = app.get<Model<FilmDocument>>(getModelToken(Film.name));

    const existingIndexes = await filmModel.collection.indexes();
    const staleTextIndex = existingIndexes.find(
      (index) =>
        index.name != null &&
        index.textIndexVersion != null &&
        index.language_override !== FILM_TEXT_INDEX_LANGUAGE_OVERRIDE,
    );
    if (staleTextIndex?.name) {
      await filmModel.collection.dropIndex(staleTextIndex.name);
      // eslint-disable-next-line no-console
      console.log(
        `🔄 (development) Đã drop text index lỗi thời '${staleTextIndex.name}' (language_override cũ='${staleTextIndex.language_override}')`,
      );
    }

    await filmModel.syncIndexes();
    // eslint-disable-next-line no-console
    console.log('🔄 (development) Đã đồng bộ lại indexes cho collection films');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️  (development) Không thể đồng bộ indexes cho films:', error);
  }
}

bootstrap();
