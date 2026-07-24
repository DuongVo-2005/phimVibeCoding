import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryActorDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên diễn viên' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo chữ cái đầu, ví dụ: A' })
  @IsOptional()
  @IsString()
  letter?: string;
}
