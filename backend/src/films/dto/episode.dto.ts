import { ApiProperty } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class EpisodeItemDto {
  @ApiProperty({ example: 'Tập 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'tap-1' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false, example: 'https://example.com/embed/tap-1' })
  @IsString()
  embedUrl?: string;

  @ApiProperty({ required: false, example: 'https://example.com/m3u8/tap-1.m3u8' })
  @IsString()
  m3u8Url?: string;
}

export class EpisodeServerDto {
  @ApiProperty({ example: 'Server #1' })
  @IsString()
  serverName: string;

  @ApiProperty({ type: [EpisodeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => EpisodeItemDto)
  items: EpisodeItemDto[];
}
