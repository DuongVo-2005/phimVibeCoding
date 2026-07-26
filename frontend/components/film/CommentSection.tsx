'use client';

import Image from 'next/image';
import { useState } from 'react';

export interface CommentItem {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
  likeCount: number;
  avatarSrc: string;
}

/**
 * CommentSection — khớp "Bình luận" trong `design/watchmovie.html`.
 *
 * Phase 14C: ô nhập + nút "Gửi" đã hoạt động thật qua `onSubmit` (logic gửi/validate thật ở
 * `useComment`, component này KHÔNG tự gọi API) — CHỈ bỏ `readOnly`, gắn `value`/`onChange`/
 * `onClick` vào ĐÚNG phần tử tĩnh đã có, không đổi class/layout (không redesign, không animation).
 * `draft` (text đang gõ) là state UI thuần tuý, tự xoá sau khi bấm Gửi — không phải state
 * nghiệp vụ nên không đặt trong hook dùng chung. "Phản hồi"/`thumb_up` vẫn KHÔNG có `onClick` —
 * Reply/Vote ngoài phạm vi Phase 14C.
 */
export function CommentSection({
  comments,
  totalLabel,
  onSubmit,
}: {
  comments: CommentItem[];
  totalLabel: string;
  onSubmit?: (content: string) => void;
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
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Chia sẻ cảm nghĩ của bạn..."
            className="w-full bg-surface-container-highest/30 border-none rounded-xl p-md text-body-md h-24 resize-none"
          />
          <div className="flex justify-end mt-sm">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-primary text-on-primary px-lg py-xs rounded-full font-label-md text-label-md"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-lg">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-md">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
              <Image
                src={comment.avatarSrc}
                alt={comment.author}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-sm mb-1">
                <span className="text-label-md font-bold text-on-surface">{comment.author}</span>
                <span className="text-[12px] text-on-surface-variant">{comment.timeAgo}</span>
              </div>
              <p className="text-body-md text-on-surface-variant">{comment.content}</p>
              <div className="flex gap-md mt-sm text-on-surface-variant">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    thumb_up
                  </span>
                  <span className="text-label-md">{comment.likeCount}</span>
                </button>
                <button
                  type="button"
                  className="text-label-md hover:text-primary transition-colors"
                >
                  Phản hồi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
