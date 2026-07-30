import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateEpisodeOrderDto {
  @ApiProperty({ example: 2, minimum: 0, description: 'Vị trí hiển thị mới (0-indexed)' })
  @IsInt()
  @Min(0)
  displayOrder: number;
}
