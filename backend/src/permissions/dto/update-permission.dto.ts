import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** key bất biến sau khi tạo — chỉ description được phép sửa. */
export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'Tạo phim mới (cập nhật mô tả)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
