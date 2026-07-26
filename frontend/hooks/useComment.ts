'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { CommentItem } from '@/components/film/CommentSection';
import { useCommentMutation } from '@/lib/query/mutations';
import { commentsQueryOptions } from '@/lib/query/options';
import { formatTimeAgo } from '@/lib/utils/format-time-ago';

/**
 * useComment — Phase 14C: hook dùng CHUNG cho Movie Detail + Watch Page — tránh lặp logic đọc
 * `GET /comments/film/:filmId` + map sang `CommentItem` (đã dùng ở Phase 12C cho riêng Watch Page,
 * nay gộp vào đây) + gọi mutation gửi bình luận.
 *
 * Expose bắt buộc theo yêu cầu: `{comments, sendComment}`. Kèm thêm `totalLabel` (backend trả
 * `meta.totalItems` chính xác hơn `comments.length`, tránh 2 nơi gọi phải tự tính lại) và
 * `isPending` — không phải phần bắt buộc, chỉ tiện ích bổ sung, không thay thế 2 field chính.
 *
 * `sendComment` KHÔNG gọi API nếu: chưa đăng nhập, `filmId` rỗng, hoặc `content` chỉ có khoảng
 * trắng — no-op an toàn, không throw.
 */
export function useComment(filmId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

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
    const trimmed = content.trim();
    if (!accessToken || !filmId || !trimmed) {
      return;
    }
    mutation.mutate({ filmId, content: trimmed });
  };

  return {
    comments,
    sendComment,
    totalLabel: String(data?.meta.totalItems ?? 0),
    isPending: mutation.isPending,
  };
}
