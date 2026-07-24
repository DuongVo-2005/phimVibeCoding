import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Mặc định chỉ trả về danh mục isActive=true nếu không truyền tham số này',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
