'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { CommentItemData } from '@/components/film/CommentSection';
import { toCommentItemData } from '@/hooks/useComment';
import { commentsQueryOptions } from '@/lib/query/options';

const REPLIES_LIMIT = 5;
/** Khớp `EDIT_WINDOW_MS` thật của `comments.service.ts` (api_design.md §12) — CHỈ dùng để ẩn nút
 * Sửa trước khi thử (tránh 1 lượt gọi chắc chắn lỗi 409), backend vẫn là nguồn xác thực duy nhất.
 * Nếu server đổi hạn mức này, hằng số ở đây cần cập nhật theo — không tự suy ra được từ response. */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

interface CommentItemProps {
  comment: CommentItemData;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (id: string, parent: string | null, content: string) => void;
  onDelete?: (id: string, parent: string | null) => void;
  onVote?: (id: string, parent: string | null) => void;
  isReplyPending?: boolean;
  isEditPending?: boolean;
  isDeletePending?: boolean;
  isVotePending?: boolean;
}

/**
 * CommentItem — Phase 17B.4: lấp `components/comment/` (trước đó chỉ có `.gitkeep`). Tách khỏi
 * `CommentSection`'s `.map()` cũ vì MỖI bình luận giờ cần state cục bộ riêng (đang sửa/đang trả
 * lời/đã mở rộng phần reply) — nhét chung vào 1 vòng lặp phẳng sẽ rất khó đọc/bảo trì.
 *
 * Reply CHỈ 1 cấp (khớp giới hạn thật của backend — `comments.service.ts`'s `create()` throw
 * BadRequestException nếu `parent` của bình luận cha khác `null`, xem ghi chú tại `parent` bên
 * dưới) — nút "Phản hồi"/"Xem phản hồi" CHỈ hiện khi `comment.parent === null` (bình luận gốc);
 * khi tự render 1 reply (đệ quy `<CommentItem>` cho từng phần tử trong `replies`), reply đó có
 * `parent !== null` nên tự động ẩn 2 nút này — không cần prop `isReply` riêng.
 *
 * Vote: không có cách biết "tôi đã vote chưa" (backend không trả field này ở bất kỳ endpoint nào,
 * xem ghi chú `useCommentVoteMutation`) nên nút Like ở đây KHÔNG có trạng thái "đã nhấn" — chỉ hiện
 * đúng số đếm thật (`upVoteCount`), bấm luôn gọi `voteType:'up'` (giữ đúng phạm vi "like/upvote",
 * không thêm UI downvote chưa được yêu cầu).
 */
export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onVote,
  isReplyPending = false,
  isEditPending = false,
  isDeletePending = false,
  isVotePending = false,
}: CommentItemProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  // Chụp mốc thời gian 1 LẦN lúc mount (lazy initializer, không gọi `Date.now()` trực tiếp trong
  // thân render — tránh lỗi "impure function during render" của react-hooks). Đủ dùng cho mục đích
  // chỉ ẩn/hiện nút Sửa (không cần cập nhật real-time nếu component ở lại màn hình quá 15 phút).
  const [mountedAt] = useState(() => Date.now());

  const isTopLevel = comment.parent === null;
  const canEdit =
    comment.isOwn && mountedAt - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS;

  const {
    data: repliesData,
    isLoading: isRepliesLoading,
    isError: isRepliesError,
    refetch: refetchReplies,
  } = useQuery({
    ...commentsQueryOptions.replies(comment.id, { page: repliesPage, limit: REPLIES_LIMIT }),
    enabled: isTopLevel && repliesExpanded,
  });

  const replies = (repliesData?.items ?? []).map((reply) =>
    toCommentItemData(reply, currentUserId),
  );

  const handleSaveEdit = () => {
    onEdit?.(comment.id, comment.parent, editDraft);
    setIsEditing(false);
  };

  const handleSendReply = () => {
    onReply?.(comment.id, replyDraft);
    setReplyDraft('');
    setIsReplying(false);
    setRepliesExpanded(true);
  };

  return (
    <div className="flex gap-md">
      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
        {comment.avatarSrc ? (
          <Image
            src={comment.avatarSrc}
            alt={comment.author}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
              person
            </span>
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-sm mb-1">
          <span className="text-label-md font-bold text-on-surface">{comment.author}</span>
          <span className="text-[12px] text-on-surface-variant">{comment.timeAgo}</span>
          {comment.isEdited ? (
            <span className="text-[12px] text-on-surface-variant">(đã sửa)</span>
          ) : null}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-sm">
            <label htmlFor={`edit-${comment.id}`} className="sr-only">
              Sửa bình luận
            </label>
            <textarea
              id={`edit-${comment.id}`}
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              disabled={isEditPending}
              className="w-full bg-surface-container-highest/30 border-none rounded-xl p-md text-body-md h-20 resize-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isEditPending}
                className="bg-primary text-on-primary px-md py-xs rounded-full text-label-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditDraft(comment.content);
                  setIsEditing(false);
                }}
                disabled={isEditPending}
                className="px-md py-xs rounded-full text-label-md text-on-surface-variant hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <p className="text-body-md text-on-surface-variant break-words">{comment.content}</p>
        )}

        <div className="flex flex-wrap items-center gap-md mt-sm text-on-surface-variant">
          <button
            type="button"
            onClick={() => onVote?.(comment.id, comment.parent)}
            disabled={isVotePending}
            aria-label={`Thích bình luận của ${comment.author}`}
            className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              thumb_up
            </span>
            <span className="text-label-md">{comment.upVoteCount}</span>
          </button>

          {isTopLevel ? (
            <button
              type="button"
              onClick={() => setIsReplying((value) => !value)}
              aria-label={`Trả lời bình luận của ${comment.author}`}
              className="text-label-md hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              Phản hồi
            </button>
          ) : null}

          {canEdit ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Sửa bình luận của bạn"
              className="text-label-md hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              Sửa
            </button>
          ) : null}

          {comment.isOwn ? (
            <button
              type="button"
              onClick={() => onDelete?.(comment.id, comment.parent)}
              disabled={isDeletePending}
              aria-label="Xoá bình luận của bạn"
              className="text-label-md hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              Xoá
            </button>
          ) : null}

          {isTopLevel ? (
            <button
              type="button"
              onClick={() => setRepliesExpanded((value) => !value)}
              aria-expanded={repliesExpanded}
              aria-controls={`replies-${comment.id}`}
              className="text-label-md hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              {repliesExpanded ? 'Ẩn phản hồi' : 'Xem phản hồi'}
            </button>
          ) : null}
        </div>

        {isReplying ? (
          <div className="flex flex-col gap-sm mt-sm">
            <label htmlFor={`reply-${comment.id}`} className="sr-only">
              Trả lời {comment.author}
            </label>
            <textarea
              id={`reply-${comment.id}`}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              disabled={isReplyPending}
              placeholder={`Trả lời ${comment.author}...`}
              className="w-full bg-surface-container-highest/30 border-none rounded-xl p-md text-body-md h-20 resize-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={handleSendReply}
                disabled={isReplyPending}
                className="bg-primary text-on-primary px-md py-xs rounded-full text-label-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Gửi
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyDraft('');
                  setIsReplying(false);
                }}
                disabled={isReplyPending}
                className="px-md py-xs rounded-full text-label-md text-on-surface-variant hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : null}

        {isTopLevel && repliesExpanded ? (
          <div
            id={`replies-${comment.id}`}
            className="flex flex-col gap-md mt-md pl-lg border-l border-white/10"
          >
            {isRepliesError ? (
              <ErrorState message="Không tải được phản hồi." onRetry={() => refetchReplies()} />
            ) : isRepliesLoading ? (
              <div className="flex gap-md" aria-hidden="true">
                <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-grow flex flex-col gap-2">
                  <SkeletonBlock className="h-4 w-32 rounded" />
                  <SkeletonBlock className="h-4 w-3/4 rounded" />
                </div>
              </div>
            ) : replies.length === 0 ? (
              <EmptyState icon="chat_bubble" message="Chưa có phản hồi nào." />
            ) : (
              <>
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onVote={onVote}
                    isReplyPending={isReplyPending}
                    isEditPending={isEditPending}
                    isDeletePending={isDeletePending}
                    isVotePending={isVotePending}
                  />
                ))}
                {repliesData && repliesData.meta.totalPages > 1 ? (
                  <Pagination
                    currentPage={repliesData.meta.page}
                    pages={[repliesData.meta.page]}
                    lastPage={repliesData.meta.totalPages}
                    onPageChange={setRepliesPage}
                  />
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
