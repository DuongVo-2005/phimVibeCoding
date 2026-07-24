import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FilmReportStatus } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFilmReportDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FilmReportStatus })
  @IsOptional()
  @IsEnum(FilmReportStatus)
  status?: FilmReportStatus;
}
