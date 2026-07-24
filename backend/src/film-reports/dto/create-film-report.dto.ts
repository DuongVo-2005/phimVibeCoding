import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFilmReportDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  film: string;

  @ApiProperty({ example: 'Video bị lỗi, không tải được' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Id của user tự báo cáo (nếu có), cho phép báo cáo ẩn danh',
    example: '65f1a2b3c4d5e6f7a8b9c0d2',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
