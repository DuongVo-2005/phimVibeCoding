import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CreateFilmReportDto } from './dto/create-film-report.dto';
import { QueryFilmReportDto } from './dto/query-film-report.dto';
import { UpdateFilmReportStatusDto } from './dto/update-film-report-status.dto';
import { FilmReportsService } from './film-reports.service';

@ApiTags('film-reports')
@Controller('film-reports')
export class FilmReportsController {
  constructor(private readonly filmReportsService: FilmReportsService) {}

  // @Public() + OptionalJwtAuthGuard (tái dùng từ Phase 4.5): cho phép báo cáo ẩn danh, nhưng nếu
  // caller gửi kèm Bearer token hợp lệ thì report được gắn đúng userId của họ — không tin userId
  // do client tự khai trong body (Phase 6.1, xem Completion Report).
  // ttl tính bằng MILLISECONDS (yêu cầu của @nestjs/throttler v6), KHÔNG phải giây.
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateFilmReportDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.filmReportsService.create(dto, user?.userId ?? null);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('film-reports:read')
  @Get()
  findAll(@Query() query: QueryFilmReportDto) {
    return this.filmReportsService.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @RequirePermission('film-reports:update')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFilmReportStatusDto) {
    return this.filmReportsService.updateStatus(id, dto);
  }
}
