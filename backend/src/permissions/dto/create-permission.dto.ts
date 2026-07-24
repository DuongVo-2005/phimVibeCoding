import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'films:create', description: 'Dạng resource:action' })
  @IsString()
  @Matches(/^[a-z][a-z-]*:[a-z][a-z-]*$/, {
    message: 'key phải có dạng resource:action (chữ thường, có thể có dấu gạch ngang)',
  })
  key: string;

  @ApiPropertyOptional({ example: 'Tạo phim mới' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
