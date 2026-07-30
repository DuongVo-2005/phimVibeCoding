import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryDashboardChartsDto {
  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 24, description: 'Số tháng gần nhất' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months: number = 12;
}
