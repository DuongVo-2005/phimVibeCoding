import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FavoriteTargetType } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFavoriteDto extends PaginationQueryDto {
  @ApiProperty({ enum: FavoriteTargetType })
  @IsEnum(FavoriteTargetType)
  targetType: FavoriteTargetType;
}
