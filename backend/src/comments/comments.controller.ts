import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { QueryCommentModerationDto } from './dto/query-comment-moderation.dto';
import { SetCommentVisibilityDto } from './dto/set-comment-visibility.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { VoteCommentDto } from './dto/vote-comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('film/:filmId')
  findByFilm(@Param('filmId') filmId: string, @Query() query: QueryCommentDto) {
    return this.commentsService.findByFilm(filmId, query);
  }

  @Public()
  @Get(':id/replies')
  findReplies(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.commentsService.findReplies(id, query);
  }

  @Public()
  @Get('top-voted')
  findTopVoted(@Query('limit') limit?: number) {
    return this.commentsService.findTopVoted(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('latest')
  findLatest(@Query('limit') limit?: number) {
    return this.commentsService.findLatest(limit ? Number(limit) : undefined);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get()
  findAllForModeration(@Query() query: QueryCommentModerationDto) {
    return this.commentsService.findAllForModeration(query);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.userId, dto);
  }

  @ApiBearerAuth()
  @Post(':id/vote')
  vote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoteCommentDto,
  ) {
    return this.commentsService.vote(user.userId, id, dto.voteType);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user.userId, id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id/visibility')
  setVisibility(@Param('id') id: string, @Body() dto: SetCommentVisibilityDto) {
    return this.commentsService.setVisibility(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commentsService.remove(user.userId, user.role, id);
  }
}
