import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên hoặc email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
