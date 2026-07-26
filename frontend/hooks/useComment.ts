'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { CommentItem } from '@/components/film/CommentSection';
import { useNotification } from '@/hooks/useNotification';
import { useCommentMutation } from '@/lib/query/mutations';
import { commentsQueryOptions } from '@/lib/query/options';
import { formatTimeAgo } from '@/lib/utils/format-time-ago';

const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng tính năng này.';

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
 */
export function useComment(filmId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();

  const { data } = useQuery({
    ...commentsQueryOptions.byFilm(filmId),
    enabled: Boolean(filmId),
  });

  const mutation = useCommentMutation();

  const comments: CommentItem[] = (data?.items ?? []).map((comment) => ({
    id: comment._id,
    author: comment.user.name,
    timeAgo: formatTimeAgo(comment.createdAt),
    content: comment.content,
    likeCount: comment.upVoteCount,
    avatarSrc: comment.user.avatar ?? '',
  }));

  const sendComment = (content: string) => {
    if (mutation.isPending) {
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

    mutation.mutate(
      { filmId, content: trimmed },
      {
        onSuccess: () => notify.success('Đã gửi bình luận của bạn.'),
        onError: () => notify.error('Không thể gửi bình luận, vui lòng thử lại.'),
      },
    );
  };

  return {
    comments,
    sendComment,
    totalLabel: String(data?.meta.totalItems ?? 0),
    isPending: mutation.isPending,
  };
}
