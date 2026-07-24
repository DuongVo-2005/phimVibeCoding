import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'Hàn Quốc' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'KR', description: 'Mã quốc gia (tuỳ chọn, không ràng buộc ISO)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;
}
