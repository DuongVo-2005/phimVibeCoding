import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ActorsModule } from '../actors/actors.module';
import { CategoriesModule } from '../categories/categories.module';
import { CrawlerHistoryModule } from '../crawler-history/crawler-history.module';
import { FilmsModule } from '../films/films.module';
import { CrawlerController } from './crawler.controller';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { CrawlerService } from './crawler.service';
import { OphimClientService } from './ophim-client.service';
import { OphimMapperService } from './ophim-mapper.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000 }),
    FilmsModule,
    ActorsModule,
    CategoriesModule,
    CrawlerHistoryModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerSchedulerService, OphimClientService, OphimMapperService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
