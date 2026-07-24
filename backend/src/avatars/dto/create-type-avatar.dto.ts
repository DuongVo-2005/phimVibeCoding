import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTypeAvatarDto {
  @ApiProperty({ example: 'Hoạt hình' })
  @IsString()
  name: string;
}
