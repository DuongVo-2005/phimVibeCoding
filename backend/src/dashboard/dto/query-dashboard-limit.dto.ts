import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Dùng chung cho `GET /dashboard/top-lists` và `GET /dashboard/recent-activity` — cả hai chỉ
 * cần giới hạn số bản ghi trả về mỗi nhóm, không có filter/sort nào khác. */
export class QueryDashboardLimitDto {
  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 5;
}
