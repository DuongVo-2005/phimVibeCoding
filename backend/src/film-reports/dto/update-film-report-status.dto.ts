import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FilmReportStatus } from '../../common/constants';

export class UpdateFilmReportStatusDto {
  @ApiProperty({ enum: FilmReportStatus, example: FilmReportStatus.RESOLVED })
  @IsEnum(FilmReportStatus)
  status: FilmReportStatus;
}
