import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerHistoryController } from './crawler-history.controller';
import { CrawlerHistoryService } from './crawler-history.service';
import { CrawlerHistory, CrawlerHistorySchema } from './schemas/crawler-history.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CrawlerHistory.name, schema: CrawlerHistorySchema }])],
  controllers: [CrawlerHistoryController],
  providers: [CrawlerHistoryService],
  exports: [CrawlerHistoryService],
})
export class CrawlerHistoryModule {}
