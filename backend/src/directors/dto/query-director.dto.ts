import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryDirectorDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên đạo diễn' })
  @IsOptional()
  @IsString()
  search?: string;
}
