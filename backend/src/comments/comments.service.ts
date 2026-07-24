import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { UserRole, VoteType } from '../common/constants';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FilmsService } from '../films/films.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { QueryCommentModerationDto } from './dto/query-comment-moderation.dto';
import { SetCommentVisibilityDto } from './dto/set-comment-visibility.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentVote, CommentVoteDocument } from './schemas/comment-vote.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';

// api_design.md §12: sửa bình luận trong vòng 15 phút kể từ khi tạo, quá hạn -> 409.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
    const filter = { film: filmId, parent: null, isHidden: false };
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
    const filter = { parent: commentId, isHidden: false };

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

  /** Admin — feed kiểm duyệt, thấy cả bình luận đang ẩn (không lọc isHidden), lọc theo phim/user.
   * Filter dùng chuỗi thô (không ép ObjectId) — khớp với cách `film`/`user` thực tế đang được lưu
   * qua Model.create() trong dự án này (đã xác minh bằng E2E Test: ép kiểu ObjectId ở đây khiến
   * filter không khớp được dữ liệu đã tồn tại), cùng pattern với findByFilm() ở trên. */
  async findAllForModeration(
    query: QueryCommentModerationDto,
  ): Promise<PaginatedResponseDto<CommentDocument>> {
    const filter: FilterQuery<CommentDocument> = {};
    if (query.filmId) {
      filter.film = query.filmId;
    }
    if (query.userId) {
      filter.user = query.userId;
    }

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate('user', 'name avatar')
        .populate('film', 'title slug posterUrl')
        .sort({ createdAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);

    return new PaginatedResponseDto(items, totalItems, query.page, query.limit);
  }

  async create(userId: string, dto: CreateCommentDto): Promise<CommentDocument> {
    if (dto.parent) {
      const parentComment = await this.commentModel.findById(dto.parent).exec();
      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }
      if (parentComment.film.toString() !== dto.film) {
        throw new BadRequestException('Bình luận cha phải thuộc cùng phim');
      }
      if (parentComment.parent) {
        throw new BadRequestException('Chỉ hỗ trợ trả lời 1 cấp (không thể trả lời một reply)');
      }
    }

    const comment = await this.commentModel.create({
      film: dto.film,
      user: userId,
      content: dto.content,
      parent: dto.parent ?? null,
    });
    await this.filmsService.incrementCommentCount(dto.film, 1);
    return comment;
  }

  /** Owner-only, trong vòng 15 phút kể từ khi tạo (409 nếu hết hạn). Response gắn thêm `isEdited:
   * true` (không phải field trong schema — cheap addition theo đúng ghi chú của api_design.md §12,
   * chỉ gắn trên response của chính lần sửa này). */
  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    if (comment.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa bình luận này');
    }
    const createdAt = comment.createdAt ?? new Date();
    if (Date.now() - createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new ConflictException('Hết thời gian chỉnh sửa bình luận');
    }

    comment.content = dto.content;
    await comment.save();

    return { ...comment.toObject(), isEdited: true };
  }

  /** Admin — ẩn/hiện bình luận (soft-moderation), không xoá, không đụng upVoteCount/downVoteCount. */
  async setVisibility(commentId: string, dto: SetCommentVisibilityDto): Promise<CommentDocument> {
    const comment = await this.commentModel
      .findByIdAndUpdate(commentId, { isHidden: dto.isHidden }, { new: true })
      .exec();
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
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
      .find({ isHidden: false })
      .populate('user', 'name avatar')
      .populate('film', 'title slug posterUrl')
      .sort({ upVoteCount: -1 })
      .limit(limit)
      .exec();
  }

  findLatest(limit = 10) {
    return this.commentModel
      .find({ isHidden: false })
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
