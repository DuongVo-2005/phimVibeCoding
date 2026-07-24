import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCommentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['new', 'top'], default: 'new' })
  @IsOptional()
  @IsIn(['new', 'top'])
  sort?: 'new' | 'top' = 'new';
}
