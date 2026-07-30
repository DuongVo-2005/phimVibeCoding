import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { NotificationType } from '../common/constants';
import { PaginationMeta } from '../common/dto/paginated-response.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { Notification, NotificationDocument } from './schemas/notification.schema';

export interface NotificationListResult {
  items: NotificationDocument[];
  meta: PaginationMeta;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /** Luôn sort mới nhất trước (yêu cầu Phase 34 — "Newest first", không cho client tuỳ chỉnh qua
   * `sortBy`/`sortOrder` như các module khác kế thừa `PaginationQueryDto`). `unreadCount` tính
   * riêng (đếm TOÀN BỘ chưa đọc của user, không bị giới hạn bởi `limit`/`isRead` filter đang áp
   * dụng cho `items`) — đây là số hiển thị badge chuông thông báo, phải luôn đúng bất kể trang nào
   * đang xem hay có lọc `isRead` hay không. */
  async findMine(userId: string, query: QueryNotificationDto): Promise<NotificationListResult> {
    // Ép kiểu ObjectId tường minh — `Model.create()`/`find()` không luôn cast đáng tin cậy chuỗi
    // ObjectId trong môi trường này (cùng lỗi đã xác nhận thực nghiệm ở `ratings.service.ts` và
    // `Favorite.target` — Phase 32). Phát hiện qua QA thực tế: script dọn dẹp lọc bằng ObjectId
    // thật không khớp được bản ghi nào dù DB có dữ liệu, vì `userId` bị lưu thành chuỗi String.
    const ownerId = new Types.ObjectId(userId);
    const filter: FilterQuery<NotificationDocument> = { userId: ownerId };
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    const [items, totalItems, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel.countDocuments({ userId: ownerId, isRead: false }).exec(),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: query.limit > 0 ? Math.ceil(totalItems / query.limit) : 0,
      },
      unreadCount,
    };
  }

  /** Lọc theo CẢ `_id` lẫn `userId` — 404 (không phải 403) khi thông báo không tồn tại hoặc không
   * thuộc về user gọi, cùng pattern ownership đã dùng ở `PlaylistsService` (không lộ thông báo đó
   * có tồn tại cho người khác hay không). */
  async markRead(userId: string, id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { isRead: true },
        { new: true },
      )
      .exec();
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationModel
      .updateMany({ userId: new Types.ObjectId(userId), isRead: false }, { isRead: true })
      .exec();
    return { updated: result.modifiedCount };
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.notificationModel
      .findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
  }

  /** Nội bộ — KHÔNG có endpoint HTTP tương ứng (Phase 34 chỉ yêu cầu GET/PATCH/PATCH/DELETE, không
   * có API tạo). Xuất từ module để phase sau nối trigger thật (comment reply, đổi trạng thái tài
   * khoản...) chỉ cần import `NotificationsService`, không phải sửa lại module này. */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, unknown> | null = null,
  ): Promise<NotificationDocument> {
    return this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      metadata,
    });
  }
}
