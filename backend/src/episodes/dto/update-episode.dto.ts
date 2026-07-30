import { PartialType } from '@nestjs/swagger';
import { CreateEpisodeDto } from './create-episode.dto';

/** Mọi field của `CreateEpisodeDto` đều optional khi update (PATCH bán phần) — vẫn KHÔNG có
 * `displayOrder` (kế thừa từ `CreateEpisodeDto`, chỉ đổi qua PATCH /episodes/:id/order). */
export class UpdateEpisodeDto extends PartialType(CreateEpisodeDto) {}
