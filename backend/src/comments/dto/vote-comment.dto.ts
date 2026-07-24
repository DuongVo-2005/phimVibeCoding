import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VoteType } from '../../common/constants';

export class VoteCommentDto {
  @ApiProperty({ enum: VoteType, example: VoteType.UP })
  @IsEnum(VoteType)
  voteType: VoteType;
}
