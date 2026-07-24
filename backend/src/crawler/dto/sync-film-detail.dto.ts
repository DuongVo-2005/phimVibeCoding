import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SyncFilmDetailDto {
  @ApiProperty({ example: 'nguoi-nhen-tren-khong' })
  @IsString()
  slug: string;
}
