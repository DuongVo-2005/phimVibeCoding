import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@rophim.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin@123' })
  @IsString()
  password: string;
}
