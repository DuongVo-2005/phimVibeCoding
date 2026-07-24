import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  film: string;

  @ApiProperty({ example: 'Phim này hay quá!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Id của comment cha nếu là reply',
    example: '65f1a2b3c4d5e6f7a8b9c0d2',
  })
  @IsOptional()
  @IsMongoId()
  parent?: string;
}
