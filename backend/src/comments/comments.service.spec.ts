import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../common/constants';
import { FilmsService } from '../films/films.service';
import { CommentsService } from './comments.service';
import { CommentVote } from './schemas/comment-vote.schema';
import { Comment } from './schemas/comment.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

const FILM_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d2';
const OTHER_USER_ID = '65f1a2b3c4d5e6f7a8b9c0d3';
const COMMENT_ID = '65f1a2b3c4d5e6f7a8b9c0d4';
const PARENT_ID = '65f1a2b3c4d5e6f7a8b9c0d5';

const findChain = () => {
  const chain: any = {};
  ['populate', 'sort', 'skip', 'limit'].forEach((m) => (chain[m] = jest.fn().mockReturnValue(chain)));
  chain.exec = jest.fn().mockResolvedValue([]);
  return chain;
};

describe('CommentsService', () => {
  let service: CommentsService;
  let commentModel: {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
    create: jest.Mock;
  };
  let commentVoteModel: { findOne: jest.Mock; create: jest.Mock; deleteOne: jest.Mock };
  let filmsService: { incrementCommentCount: jest.Mock };

  beforeEach(async () => {
    commentModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };
    commentVoteModel = { findOne: jest.fn(), create: jest.fn(), deleteOne: jest.fn() };
    filmsService = { incrementCommentCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getModelToken(Comment.name), useValue: commentModel },
        { provide: getModelToken(CommentVote.name), useValue: commentVoteModel },
        { provide: FilmsService, useValue: filmsService },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  describe('listing công khai — lọc isHidden:false', () => {
    it('findByFilm lọc isHidden:false, parent:null', async () => {
      const chain = findChain();
      commentModel.find.mockReturnValue(chain);
      commentModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findByFilm(FILM_ID, { sort: 'new', page: 1, limit: 20, skip: 0 } as any);

      expect(commentModel.find).toHaveBeenCalledWith({
        film: FILM_ID,
        parent: null,
        isHidden: false,
      });
    });

    it('findReplies lọc isHidden:false', async () => {
      const chain = findChain();
      commentModel.find.mockReturnValue(chain);
      commentModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findReplies(COMMENT_ID, { page: 1, limit: 20, skip: 0 } as any);

      expect(commentModel.find).toHaveBeenCalledWith({ parent: COMMENT_ID, isHidden: false });
    });

    it('findTopVoted lọc isHidden:false', async () => {
      const chain = findChain();
      commentModel.find.mockReturnValue(chain);

      await service.findTopVoted(10);

      expect(commentModel.find).toHaveBeenCalledWith({ isHidden: false });
    });

    it('findLatest lọc isHidden:false', async () => {
      const chain = findChain();
      commentModel.find.mockReturnValue(chain);

      await service.findLatest(10);

      expect(commentModel.find).toHaveBeenCalledWith({ isHidden: false });
    });
  });

  describe('findAllForModeration', () => {
    it('không lọc isHidden (thấy cả bình luận ẩn); lọc theo filmId/userId khi có — dùng chuỗi thô, khớp cách film/user thực tế được lưu qua Model.create() (đã xác minh bằng E2E Test, xem completion report)', async () => {
      const chain = findChain();
      commentModel.find.mockReturnValue(chain);
      commentModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findAllForModeration({
        filmId: FILM_ID,
        userId: USER_ID,
        page: 1,
        limit: 20,
        skip: 0,
      } as any);

      expect(commentModel.find).toHaveBeenCalledWith({ film: FILM_ID, user: USER_ID });
    });
  });

  describe('create — validate parent (single-level nesting, cùng phim)', () => {
    it('ném NotFoundException khi parent không tồn tại', async () => {
      commentModel.findById.mockReturnValue(execResolves(null));

      await expect(
        service.create(USER_ID, { film: FILM_ID, content: 'reply', parent: PARENT_ID }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném BadRequestException khi parent thuộc phim khác', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ _id: PARENT_ID, film: { toString: () => 'other-film-id' }, parent: null }),
      );

      await expect(
        service.create(USER_ID, { film: FILM_ID, content: 'reply', parent: PARENT_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi cố reply vào một reply (chỉ hỗ trợ nested 1 cấp)', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({
          _id: PARENT_ID,
          film: { toString: () => FILM_ID },
          parent: new Types.ObjectId(),
        }),
      );

      await expect(
        service.create(USER_ID, { film: FILM_ID, content: 'reply', parent: PARENT_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tạo reply thành công khi parent hợp lệ (cùng phim, không nested)', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ _id: PARENT_ID, film: { toString: () => FILM_ID }, parent: null }),
      );
      const created = { _id: 'c1' };
      commentModel.create.mockResolvedValue(created);

      const result = await service.create(USER_ID, {
        film: FILM_ID,
        content: 'reply',
        parent: PARENT_ID,
      });

      expect(filmsService.incrementCommentCount).toHaveBeenCalledWith(FILM_ID, 1);
      expect(result).toBe(created);
    });

    it('tạo comment gốc (không có parent) không cần tra cứu parent', async () => {
      const created = { _id: 'c1' };
      commentModel.create.mockResolvedValue(created);

      await service.create(USER_ID, { film: FILM_ID, content: 'top-level' });

      expect(commentModel.findById).not.toHaveBeenCalled();
      expect(commentModel.create).toHaveBeenCalledWith({
        film: FILM_ID,
        user: USER_ID,
        content: 'top-level',
        parent: null,
      });
    });
  });

  describe('update — owner-only, cửa sổ 15 phút', () => {
    it('ném NotFoundException khi không tìm thấy bình luận', async () => {
      commentModel.findById.mockReturnValue(execResolves(null));

      await expect(service.update(USER_ID, COMMENT_ID, { content: 'sửa' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ném ForbiddenException khi không phải chủ bình luận', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ user: { toString: () => OTHER_USER_ID }, createdAt: new Date() }),
      );

      await expect(service.update(USER_ID, COMMENT_ID, { content: 'sửa' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('ném ConflictException khi đã quá 15 phút kể từ khi tạo', async () => {
      const oldCreatedAt = new Date(Date.now() - 16 * 60 * 1000);
      commentModel.findById.mockReturnValue(
        execResolves({ user: { toString: () => USER_ID }, createdAt: oldCreatedAt }),
      );

      await expect(service.update(USER_ID, COMMENT_ID, { content: 'sửa' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('sửa thành công trong vòng 15 phút, response có isEdited:true', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const toObject = jest.fn().mockReturnValue({ _id: COMMENT_ID, content: 'nội dung cũ' });
      const comment: any = {
        user: { toString: () => USER_ID },
        createdAt: new Date(),
        content: 'nội dung cũ',
        save,
        toObject,
      };
      commentModel.findById.mockReturnValue(execResolves(comment));

      const result = await service.update(USER_ID, COMMENT_ID, { content: 'nội dung mới' });

      expect(comment.content).toBe('nội dung mới');
      expect(save).toHaveBeenCalled();
      expect(result).toMatchObject({ isEdited: true });
    });
  });

  describe('setVisibility — admin soft-moderation', () => {
    it('ném NotFoundException khi không tìm thấy bình luận', async () => {
      commentModel.findByIdAndUpdate.mockReturnValue(execResolves(null));

      await expect(service.setVisibility(COMMENT_ID, { isHidden: true })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cập nhật đúng field isHidden, không đụng upVoteCount/downVoteCount', async () => {
      commentModel.findByIdAndUpdate.mockReturnValue(
        execResolves({ _id: COMMENT_ID, isHidden: true }),
      );

      await service.setVisibility(COMMENT_ID, { isHidden: true });

      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        COMMENT_ID,
        { isHidden: true },
        { new: true },
      );
    });
  });

  describe('remove — owner-or-admin (hành vi đã có từ trước, giữ nguyên)', () => {
    it('chủ bình luận tự xoá được', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ _id: COMMENT_ID, user: { toString: () => USER_ID }, film: FILM_ID }),
      );
      commentModel.findByIdAndDelete.mockReturnValue(execResolves({}));

      await service.remove(USER_ID, UserRole.USER, COMMENT_ID);

      expect(filmsService.incrementCommentCount).toHaveBeenCalledWith(FILM_ID, -1);
    });

    it('admin xoá được bình luận của người khác', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ _id: COMMENT_ID, user: { toString: () => OTHER_USER_ID }, film: FILM_ID }),
      );
      commentModel.findByIdAndDelete.mockReturnValue(execResolves({}));

      await expect(service.remove(USER_ID, UserRole.ADMIN, COMMENT_ID)).resolves.toBeUndefined();
    });

    it('user thường không xoá được bình luận của người khác -> ForbiddenException', async () => {
      commentModel.findById.mockReturnValue(
        execResolves({ _id: COMMENT_ID, user: { toString: () => OTHER_USER_ID }, film: FILM_ID }),
      );

      await expect(service.remove(USER_ID, UserRole.USER, COMMENT_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
