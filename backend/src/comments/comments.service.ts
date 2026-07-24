import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole, VoteType } from '../common/constants';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FilmsService } from '../films/films.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { CommentVote, CommentVoteDocument } from './schemas/comment-vote.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(CommentVote.name) private readonly commentVoteModel: Model<CommentVoteDocument>,
    private readonly filmsService: FilmsService,
  ) {}

  async findByFilm(
    filmId: string,
    query: QueryCommentDto,
  ): Promise<PaginatedResponseDto<CommentDocument>> {
    const filter = { film: filmId, parent: null };
    const sort: Record<string, 1 | -1> =
      query.sort === 'top' ? { upVoteCount: -1 } : { createdAt: -1 };

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate('user', 'name avatar')
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async findReplies(
    commentId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CommentDocument>> {
    const filter = { parent: commentId };

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate('user', 'name avatar')
        .sort({ createdAt: 1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async create(userId: string, dto: CreateCommentDto): Promise<CommentDocument> {
    const comment = await this.commentModel.create({
      film: dto.film,
      user: userId,
      content: dto.content,
      parent: dto.parent ?? null,
    });
    await this.filmsService.incrementCommentCount(dto.film, 1);
    return comment;
  }

  async vote(userId: string, commentId: string, voteType: VoteType): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const counterField = (type: VoteType) =>
      type === VoteType.UP ? 'upVoteCount' : 'downVoteCount';

    const existingVote = await this.commentVoteModel
      .findOne({ comment: commentId, user: userId })
      .exec();

    if (!existingVote) {
      await this.commentVoteModel.create({ comment: commentId, user: userId, voteType });
      await this.commentModel
        .findByIdAndUpdate(commentId, { $inc: { [counterField(voteType)]: 1 } })
        .exec();
    } else if (existingVote.voteType === voteType) {
      await this.commentVoteModel.deleteOne({ _id: existingVote._id }).exec();
      await this.commentModel
        .findByIdAndUpdate(commentId, { $inc: { [counterField(voteType)]: -1 } })
        .exec();
    } else {
      const oldVoteType = existingVote.voteType;
      existingVote.voteType = voteType;
      await existingVote.save();
      await this.commentModel
        .findByIdAndUpdate(commentId, {
          $inc: { [counterField(oldVoteType)]: -1, [counterField(voteType)]: 1 },
        })
        .exec();
    }

    const updated = await this.commentModel.findById(commentId).exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    return updated;
  }

  findTopVoted(limit = 10) {
    return this.commentModel
      .find()
      .populate('user', 'name avatar')
      .populate('film', 'title slug posterUrl')
      .sort({ upVoteCount: -1 })
      .limit(limit)
      .exec();
  }

  findLatest(limit = 10) {
    return this.commentModel
      .find()
      .populate('user', 'name avatar')
      .populate('film', 'title slug posterUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async remove(userId: string, role: UserRole, commentId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    if (comment.user.toString() !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.commentModel.findByIdAndDelete(commentId).exec();
    await this.filmsService.incrementCommentCount(comment.film as Types.ObjectId, -1);
  }
}
