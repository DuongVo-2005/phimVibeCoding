import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { History, HistorySchema } from './schemas/history.schema';
import { HistoriesController } from './histories.controller';
import { HistoriesService } from './histories.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: History.name, schema: HistorySchema }])],
  controllers: [HistoriesController],
  providers: [HistoriesService],
  exports: [HistoriesService],
})
export class HistoriesModule {}
