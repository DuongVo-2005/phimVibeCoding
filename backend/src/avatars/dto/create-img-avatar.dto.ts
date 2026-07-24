import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class CreateImgAvatarDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  type: string;

  @ApiProperty({ example: 'https://example.com/avatars/01.png' })
  @IsString()
  url: string;
}
