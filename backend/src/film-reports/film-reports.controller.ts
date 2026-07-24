import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { CreateFilmReportDto } from './dto/create-film-report.dto';
import { QueryFilmReportDto } from './dto/query-film-report.dto';
import { UpdateFilmReportStatusDto } from './dto/update-film-report-status.dto';
import { FilmReportsService } from './film-reports.service';

@ApiTags('film-reports')
@Controller('film-reports')
export class FilmReportsController {
  constructor(private readonly filmReportsService: FilmReportsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateFilmReportDto) {
    return this.filmReportsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryFilmReportDto) {
    return this.filmReportsService.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFilmReportStatusDto) {
    return this.filmReportsService.updateStatus(id, dto);
  }
}
