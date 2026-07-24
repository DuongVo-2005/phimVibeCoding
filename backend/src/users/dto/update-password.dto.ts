import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'oldPass@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ minLength: 8, example: 'newPass@123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
