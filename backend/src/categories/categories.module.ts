import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerHistoryModule } from '../crawler-history/crawler-history.module';
import { Film, FilmSchema } from '../films/schemas/film.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { OphimCategorySyncService } from './ophim-category-sync.service';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000 }),
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Film.name, schema: FilmSchema },
    ]),
    CrawlerHistoryModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, OphimCategorySyncService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
