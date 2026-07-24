import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  @IsString()
  token: string;

  @ApiProperty({ minLength: 8, example: 'newPass@123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
