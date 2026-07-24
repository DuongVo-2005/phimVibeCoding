import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class UpdateHistoryDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  film: string;

  @ApiPropertyOptional({ example: 'tap-1' })
  @IsOptional()
  @IsString()
  episodeSlug?: string;

  @ApiPropertyOptional({ example: 'Server #1' })
  @IsOptional()
  @IsString()
  serverName?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  progressSeconds?: number;

  @ApiPropertyOptional({ example: 3600 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalDurationSeconds?: number;
}
