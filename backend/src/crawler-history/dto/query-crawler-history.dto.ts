import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { CrawlerRunStatus } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCrawlerHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Nguồn crawler, vd: 'ophim-films', 'ophim-types'" })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: CrawlerRunStatus })
  @IsOptional()
  @IsEnum(CrawlerRunStatus)
  status?: CrawlerRunStatus;

  @ApiPropertyOptional({ description: 'Lọc từ thời điểm (ISO 8601), theo startedAt' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc đến thời điểm (ISO 8601), theo startedAt' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
