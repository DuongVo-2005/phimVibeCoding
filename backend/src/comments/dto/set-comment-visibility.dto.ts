import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCommentVisibilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isHidden: boolean;
}
