'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { CommentItem } from '@/components/comment/CommentItem';

export interface CommentItemData {
  id: string;
  isOwn: boolean;
  author: string;
  timeAgo: string;
  createdAt: string;
  content: string;
  upVoteCount: number;
  avatarSrc: string;
  isEdited: boolean;
  /** `null` = bình luận gốc, khác `null` = reply — luôn `null` ở danh sách gốc do `CommentSection`
   * render (`CommentItem` tự nạp reply riêng, xem `components/comment/CommentItem.tsx`). */
  parent: string | null;
}

const SKELETON_ROWS = 3;

/**
 * CommentSection — khớp "Bình luận" trong `design/watchmovie.html`.
 *
 * Phase 14C: ô nhập + nút "Gửi" đã hoạt động thật qua `onSubmit` (logic gửi/validate thật ở
 * `useComment`, component này KHÔNG tự gọi API) — CHỈ bỏ `readOnly`, gắn `value`/`onChange`/
 * `onClick` vào ĐÚNG phần tử tĩnh đã có, không đổi class/layout (không redesign, không animation).
 * `draft` (text đang gõ) là state UI thuần tuý, tự xoá sau khi bấm Gửi — không phải state
 * nghiệp vụ nên không đặt trong hook dùng chung.
 *
 * Phase 15A: thêm `disabled` — disable CẢ textarea lẫn nút "Gửi" khi mutation đang pending (nơi
 * gọi truyền vào), `disabled:opacity-50` là utility class chuẩn, không phải redesign/animation.
 *
 * Phase 17B.4: thêm `isLoading`/`isError`/`onRetry` (Skeleton/ErrorState cho danh sách bình luận —
 * trước đây hook `useComment` không lộ 2 trạng thái này nên KHÔNG render được, luôn hiện thẳng
 * mảng rỗng). Phần render 1 bình luận tách hẳn sang `CommentItem` (`components/comment/`, thư mục
 * trước đây chỉ có `.gitkeep`) — Reply/Edit/Delete/Vote/Nested-replies cần state cục bộ riêng cho
 * TỪNG bình luận (đang sửa/đang trả lời/đã mở rộng replies...), nhét hết vào 1 vòng `.map()` phẳng
 * ở đây sẽ khiến component này phình to khó bảo trì — không phải tạo bản sao, mà lấp đúng vị trí
 * đã được quy hoạch sẵn. Composer LUÔN hiện (kể cả khi danh sách rỗng/lỗi/đang tải) — cho phép viết
 * bình luận đầu tiên độc lập với trạng thái tải danh sách.
 */
export function CommentSection({
  comments,
  totalLabel,
  onSubmit,
  disabled = false,
  isLoading = false,
  isError = false,
  onRetry,
  onReply,
  onEdit,
  onDelete,
  onVote,
  isReplyPending = false,
  isEditPending = false,
  isDeletePending = false,
  isVotePending = false,
}: {
  comments: CommentItemData[];
  totalLabel: string;
  onSubmit?: (content: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (id: string, parent: string | null, content: string) => void;
  onDelete?: (id: string, parent: string | null) => void;
  onVote?: (id: string, parent: string | null) => void;
  isReplyPending?: boolean;
  isEditPending?: boolean;
  isDeletePending?: boolean;
  isVotePending?: boolean;
}) {
  const [draft, setDraft] = useState('');

  const handleSubmit = () => {
    onSubmit?.(draft);
    setDraft('');
  };

  return (
    <section className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-lg rounded-[20px]">
      <h3 className="text-headline-md font-headline-md mb-lg">Bình luận ({totalLabel})</h3>

      <div className="flex gap-md mb-xl">
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
            person
          </span>
        </div>
        <div className="flex-grow">
          <label htmlFor="comment-composer" className="sr-only">
            Viết bình luận
          </label>
          <textarea
            id="comment-composer"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled}
            placeholder="Chia sẻ cảm nghĩ của bạn..."
            className="w-full bg-surface-container-highest/30 border-none rounded-xl p-md text-body-md h-24 resize-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
          <div className="flex justify-end mt-sm">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              className="bg-primary text-on-primary px-lg py-xs rounded-full font-label-md text-label-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {isError ? (
        <ErrorState message="Không tải được bình luận." onRetry={onRetry ?? (() => {})} />
      ) : isLoading ? (
        <div className="space-y-lg" aria-hidden="true">
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <div key={index} className="flex gap-md">
              <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-grow flex flex-col gap-2">
                <SkeletonBlock className="h-4 w-32 rounded" />
                <SkeletonBlock className="h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon="chat_bubble"
          message="Chưa có bình luận nào."
          subtitle="Hãy là người đầu tiên chia sẻ cảm nghĩ."
        />
      ) : (
        <div className="space-y-lg">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
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
        </div>
      )}
    </section>
  );
}
