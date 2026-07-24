import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Phim này hay quá, xem lại vẫn thấy hay!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
