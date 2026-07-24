import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsModule } from '../films/films.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentVote, CommentVoteSchema } from './schemas/comment-vote.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: CommentVote.name, schema: CommentVoteSchema },
    ]),
    FilmsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
