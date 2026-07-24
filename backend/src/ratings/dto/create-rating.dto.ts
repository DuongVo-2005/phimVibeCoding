import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ minimum: 1, maximum: 10, example: 8 })
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}
