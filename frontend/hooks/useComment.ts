'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ApiRequestError } from '@/lib/api/client';
import type { CommentItemData } from '@/components/film/CommentSection';
import { useNotification } from '@/hooks/useNotification';
import {
  useCommentMutation,
  useCommentRemoveMutation,
  useCommentUpdateMutation,
  useCommentVoteMutation,
} from '@/lib/query/mutations';
import { commentsQueryOptions } from '@/lib/query/options';
import type { Comment } from '@/lib/types/comment';
import { formatTimeAgo } from '@/lib/utils/format-time-ago';

const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng tính năng này.';
const GENERIC_ERROR_MESSAGE = 'Có lỗi xảy ra, vui lòng thử lại.';

function toErrorMessage(error: unknown): string {
  return error instanceof ApiRequestError ? error.message : GENERIC_ERROR_MESSAGE;
}

/** Dùng CHUNG cho danh sách bình luận gốc (hook này) LẪN danh sách reply (`CommentItem` tự nạp
 * riêng qua `commentsQueryOptions.replies`, xem `components/comment/CommentItem.tsx`) — tránh lặp
 * lại logic map `Comment` (raw) → `CommentItemData` (hiển thị) ở 2 nơi. */
export function toCommentItemData(comment: Comment, currentUserId?: string): CommentItemData {
  return {
    id: comment._id,
    isOwn: Boolean(currentUserId) && comment.user._id === currentUserId,
    author: comment.user.name,
    timeAgo: formatTimeAgo(comment.createdAt),
    createdAt: comment.createdAt,
    content: comment.content,
    upVoteCount: comment.upVoteCount,
    avatarSrc: comment.user.avatar ?? '',
    isEdited: comment.isEdited ?? false,
    parent: comment.parent,
  };
}

/**
 * useComment — Phase 14C: hook dùng CHUNG cho Movie Detail + Watch Page — tránh lặp logic đọc
 * `GET /comments/film/:filmId` + map sang `CommentItem` (đã dùng ở Phase 12C cho riêng Watch Page,
 * nay gộp vào đây) + gọi mutation gửi bình luận.
 *
 * Expose bắt buộc theo yêu cầu: `{comments, sendComment}`. Kèm thêm `totalLabel` (backend trả
 * `meta.totalItems` chính xác hơn `comments.length`, tránh 2 nơi gọi phải tự tính lại) và
 * `isPending` — không phải phần bắt buộc, chỉ tiện ích bổ sung, không thay thế 2 field chính.
 *
 * Phase 15A: chưa đăng nhập → `notify.info()` (thay no-op im lặng). Chặn double-click bằng
 * `mutation.isPending` (kiểm tra TRƯỚC — nếu đang gửi thì bỏ qua click/gửi tiếp theo). `content`
 * rỗng/chỉ khoảng trắng vẫn no-op im lặng (không phải lỗi cần thông báo — nút "Gửi" không nên báo
 * lỗi chỉ vì người dùng chưa gõ gì). Thành công/lỗi → `notify.success()`/`notify.error()` qua
 * callback thứ 2 của `mutate()` (không sửa `useCommentMutation`).
 *
 * Phase 17B.4: mở rộng — Reply/Edit/Delete/Vote + `isLoading`/`isError`/`refetch` (trước đây hook
 * này không hề lộ trạng thái loading/error, `CommentSection` luôn hiện "0 bình luận" trong lúc
 * đang tải; nay có để dựng Skeleton/ErrorState đúng yêu cầu). Toàn bộ action MỚI vẫn tập trung ở
 * ĐÚNG 1 hook này (không tạo hook riêng cho Reply/Edit/Delete/Vote — "No duplicated hook" đúng theo
 * yêu cầu), `CommentSection`/`CommentItem` chỉ nhận callback, không tự gọi mutation.
 *
 * `isOwn` so khớp `comment.user._id` với `session.user.id` — CHỈ user hiện tại mới thấy nút Sửa/
 * Xoá trên chính bình luận của họ (khớp rule ownership thật của backend, xem `comments.service.ts`
 * `update()`/`remove()` — 403 nếu không phải chủ). Lỗi từ mutation (403 hết quyền, 409 hết hạn 15
 * phút sửa...) dùng THẲNG `error.message` thật từ backend (`ApiRequestError`, xem `lib/api/
 * client.ts`) thay vì tự bịa message chung chung — chính xác hơn theo từng tình huống.
 */
export function useComment(filmId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const currentUserId = session?.user?.id;
  const notify = useNotification();

  const { data, isLoading, isError, refetch } = useQuery({
    ...commentsQueryOptions.byFilm(filmId),
    enabled: Boolean(filmId),
  });

  const createMutation = useCommentMutation();
  const updateMutation = useCommentUpdateMutation();
  const removeMutation = useCommentRemoveMutation();
  const voteMutation = useCommentVoteMutation();

  const comments: CommentItemData[] = (data?.items ?? []).map((comment) =>
    toCommentItemData(comment, currentUserId),
  );

  const sendComment = (content: string) => {
    if (createMutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    const trimmed = content.trim();
    if (!filmId || !trimmed) {
      return;
    }

    createMutation.mutate(
      { filmId, content: trimmed },
      {
        onSuccess: () => notify.success('Đã gửi bình luận của bạn.'),
        onError: () => notify.error('Không thể gửi bình luận, vui lòng thử lại.'),
      },
    );
  };

  const sendReply = (parentId: string, content: string) => {
    if (createMutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    const trimmed = content.trim();
    if (!filmId || !trimmed) {
      return;
    }

    createMutation.mutate(
      { filmId, content: trimmed, parent: parentId },
      {
        onSuccess: () => notify.success('Đã gửi phản hồi của bạn.'),
        onError: () => notify.error('Không thể gửi phản hồi, vui lòng thử lại.'),
      },
    );
  };

  const editComment = (id: string, parent: string | null, content: string) => {
    if (updateMutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    updateMutation.mutate(
      { id, filmId, parent, content: trimmed },
      {
        onSuccess: () => notify.success('Đã cập nhật bình luận.'),
        onError: (error) => notify.error(toErrorMessage(error)),
      },
    );
  };

  const deleteComment = (id: string, parent: string | null) => {
    if (removeMutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    removeMutation.mutate(
      { id, filmId, parent },
      {
        onSuccess: () => notify.success('Đã xoá bình luận.'),
        onError: (error) => notify.error(toErrorMessage(error)),
      },
    );
  };

  const voteComment = (id: string, parent: string | null) => {
    if (voteMutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    voteMutation.mutate(
      { id, filmId, parent, voteType: 'up' },
      { onError: () => notify.error('Không thể vote bình luận, vui lòng thử lại.') },
    );
  };

  return {
    comments,
    sendComment,
    totalLabel: String(data?.meta.totalItems ?? 0),
    isPending: createMutation.isPending,
    isLoading,
    isError,
    refetch,
    sendReply,
    editComment,
    deleteComment,
    voteComment,
    isUpdatePending: updateMutation.isPending,
    isRemovePending: removeMutation.isPending,
    isVotePending: voteMutation.isPending,
  };
}
