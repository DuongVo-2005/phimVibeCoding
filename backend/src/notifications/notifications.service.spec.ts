import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { NotificationType } from '../common/constants';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';

const execResolves = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

function chainable(value: unknown) {
  const query: Record<string, jest.Mock> = {};
  for (const method of ['sort', 'skip', 'limit']) {
    query[method] = jest.fn().mockReturnValue(query);
  }
  query.exec = jest.fn().mockResolvedValue(value);
  return query;
}

// Chuỗi 24-hex hợp lệ — BẮT BUỘC dùng ObjectId thật (không phải chuỗi tuỳ ý như 'user-1') vì
// service giờ ép kiểu `new Types.ObjectId(userId)` tường minh (fix bug lưu userId thành String,
// phát hiện qua QA thực tế — xem ghi chú `NotificationsService.findMine`). `new Types.ObjectId()`
// ném lỗi ngay nếu chuỗi truyền vào không đúng định dạng ObjectId.
const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findOneAndUpdate: jest.Mock;
    updateMany: jest.Mock;
    findOneAndDelete: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    notificationModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      findOneAndDelete: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: notificationModel },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('findMine', () => {
    it('trả về items + meta phân trang + unreadCount, luôn sort createdAt:-1 (newest first)', async () => {
      const items = [{ _id: 'n1' }, { _id: 'n2' }];
      const findQuery = chainable(items);
      notificationModel.find.mockReturnValue(findQuery);
      notificationModel.countDocuments
        .mockReturnValueOnce(execResolves(2)) // totalItems (filter chung)
        .mockReturnValueOnce(execResolves(5)); // unreadCount (luôn đếm riêng isRead:false)

      const result = await service.findMine(USER_ID, { page: 1, limit: 10, skip: 0 } as any);

      const findFilter = notificationModel.find.mock.calls[0][0];
      expect(findFilter.userId).toBeInstanceOf(Types.ObjectId);
      expect(findFilter.userId.toString()).toBe(USER_ID);
      expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result.items).toBe(items);
      expect(result.meta).toEqual({ page: 1, limit: 10, totalItems: 2, totalPages: 1 });
      expect(result.unreadCount).toBe(5);
    });

    it('có isRead filter -> filter cả find lẫn countDocuments totalItems, KHÔNG ảnh hưởng unreadCount', async () => {
      notificationModel.find.mockReturnValue(chainable([]));
      notificationModel.countDocuments
        .mockReturnValueOnce(execResolves(0))
        .mockReturnValueOnce(execResolves(3));

      const result = await service.findMine(USER_ID, {
        page: 1,
        limit: 10,
        skip: 0,
        isRead: true,
      } as any);

      const findFilter = notificationModel.find.mock.calls[0][0];
      expect(findFilter.isRead).toBe(true);
      expect(findFilter.userId.toString()).toBe(USER_ID);
      // Lệnh countDocuments thứ 2 (unreadCount) luôn dùng {userId, isRead:false} bất kể filter isRead đang áp dụng
      const unreadCountFilter = notificationModel.countDocuments.mock.calls[1][0];
      expect(unreadCountFilter.isRead).toBe(false);
      expect(unreadCountFilter.userId.toString()).toBe(USER_ID);
      expect(result.unreadCount).toBe(3);
    });

    it('không truyền isRead -> filter chỉ có userId (trả về cả đã đọc lẫn chưa đọc)', async () => {
      notificationModel.find.mockReturnValue(chainable([]));
      notificationModel.countDocuments.mockReturnValue(execResolves(0));

      await service.findMine(USER_ID, { page: 1, limit: 10, skip: 0 } as any);

      const findFilter = notificationModel.find.mock.calls[0][0];
      expect(findFilter).not.toHaveProperty('isRead');
      expect(Object.keys(findFilter)).toEqual(['userId']);
    });
  });

  describe('markRead', () => {
    it('cập nhật isRead=true cho đúng thông báo của đúng user, trả về document mới', async () => {
      const updated = { _id: 'n1', isRead: true };
      notificationModel.findOneAndUpdate.mockReturnValue(execResolves(updated));

      const result = await service.markRead(USER_ID, 'n1');

      const [filterArg, updateArg, optionsArg] = notificationModel.findOneAndUpdate.mock.calls[0];
      expect(filterArg._id).toBe('n1');
      expect(filterArg.userId).toBeInstanceOf(Types.ObjectId);
      expect(filterArg.userId.toString()).toBe(USER_ID);
      expect(updateArg).toEqual({ isRead: true });
      expect(optionsArg).toEqual({ new: true });
      expect(result).toBe(updated);
    });

    it('không tồn tại hoặc không thuộc về user -> NotFoundException (404, không phải 403 — không lộ thông tin)', async () => {
      notificationModel.findOneAndUpdate.mockReturnValue(execResolves(null));

      await expect(service.markRead(USER_ID, 'n-khong-ton-tai')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('updateMany chỉ những thông báo CHƯA đọc của user, trả về số lượng đã cập nhật', async () => {
      notificationModel.updateMany.mockReturnValue(execResolves({ modifiedCount: 4 }));

      const result = await service.markAllRead(USER_ID);

      const [filterArg, updateArg] = notificationModel.updateMany.mock.calls[0];
      expect(filterArg.isRead).toBe(false);
      expect(filterArg.userId.toString()).toBe(USER_ID);
      expect(updateArg).toEqual({ isRead: true });
      expect(result).toEqual({ updated: 4 });
    });

    it('không có thông báo chưa đọc -> updated=0, không lỗi', async () => {
      notificationModel.updateMany.mockReturnValue(execResolves({ modifiedCount: 0 }));

      const result = await service.markAllRead(USER_ID);

      expect(result).toEqual({ updated: 0 });
    });
  });

  describe('remove', () => {
    it('xoá đúng thông báo của đúng user', async () => {
      notificationModel.findOneAndDelete.mockReturnValue(execResolves({ _id: 'n1' }));

      await service.remove(USER_ID, 'n1');

      const filterArg = notificationModel.findOneAndDelete.mock.calls[0][0];
      expect(filterArg._id).toBe('n1');
      expect(filterArg.userId.toString()).toBe(USER_ID);
    });

    it('không tồn tại hoặc không thuộc về user -> NotFoundException', async () => {
      notificationModel.findOneAndDelete.mockReturnValue(execResolves(null));

      await expect(service.remove(USER_ID, 'n-khong-ton-tai')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create (nội bộ, không có endpoint HTTP)', () => {
    it('tạo thông báo với đúng userId (ObjectId thật)/type/title/message, metadata mặc định null khi không truyền', async () => {
      notificationModel.create.mockResolvedValue({ _id: 'n1' });

      await service.create(USER_ID, NotificationType.SYSTEM, 'Tiêu đề', 'Nội dung');

      const createArg = notificationModel.create.mock.calls[0][0];
      expect(createArg.userId).toBeInstanceOf(Types.ObjectId);
      expect(createArg.userId.toString()).toBe(USER_ID);
      expect(createArg).toMatchObject({
        type: NotificationType.SYSTEM,
        title: 'Tiêu đề',
        message: 'Nội dung',
        metadata: null,
      });
    });

    it('truyền metadata -> lưu đúng metadata', async () => {
      notificationModel.create.mockResolvedValue({ _id: 'n1' });

      await service.create(USER_ID, NotificationType.COMMENT, 'T', 'M', { commentId: 'c1' });

      expect(notificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { commentId: 'c1' } }),
      );
    });
  });
});
