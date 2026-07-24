import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, example: 'user@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: 'Nguyen Van A' })
  @IsString()
  name?: string;
}
