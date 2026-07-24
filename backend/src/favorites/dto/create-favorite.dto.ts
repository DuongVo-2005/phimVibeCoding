import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { FavoriteTargetType } from '../../common/constants';

export class CreateFavoriteDto {
  @ApiProperty({ enum: FavoriteTargetType, example: FavoriteTargetType.FILM })
  @IsEnum(FavoriteTargetType)
  targetType: FavoriteTargetType;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  target: string;
}
