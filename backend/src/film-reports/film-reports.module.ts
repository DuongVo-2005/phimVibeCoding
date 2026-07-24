import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmReportsController } from './film-reports.controller';
import { FilmReportsService } from './film-reports.service';
import { FilmReport, FilmReportSchema } from './schemas/film-report.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FilmReport.name, schema: FilmReportSchema }])],
  controllers: [FilmReportsController],
  providers: [FilmReportsService],
  exports: [FilmReportsService],
})
export class FilmReportsModule {}
