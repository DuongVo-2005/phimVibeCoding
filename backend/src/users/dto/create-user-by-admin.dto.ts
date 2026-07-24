import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserByAdminDto {
  @ApiProperty({ example: 'editor@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'editor@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Mặc định là role "user" nếu bỏ trống',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  roleIds?: string[];
}
