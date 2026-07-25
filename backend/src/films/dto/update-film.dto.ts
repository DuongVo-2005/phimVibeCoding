import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFilmDto } from './create-film.dto';

export class UpdateFilmDto extends PartialType(OmitType(CreateFilmDto, ['episodes'] as const)) {}
