import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCommentModerationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsOptional()
  @IsMongoId()
  filmId?: string;

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d2' })
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
