import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'user@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false, example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  name?: string;
}
