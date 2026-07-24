import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Phim yêu thích của tôi' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
