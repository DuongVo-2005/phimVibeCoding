'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCommentRemoveMutation, useCommentVisibilityMutation } from '@/lib/query/mutations';
import { commentsQueryOptions } from '@/lib/query/options';
import type { CommentModerationItem } from '@/lib/types/comment';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';

const PAGE_LIMIT = 20;
const TABLE_COLUMNS = ['Người dùng', 'Phim', 'Nội dung', 'Trạng thái', 'Ngày tạo', 'Thao tác'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * AdminCommentListView — Phase 19B.7. `GET /comments` (moderation, admin-only) +
 * `PATCH /comments/:id/visibility` + `DELETE /comments/:id` đều đã có sẵn API client từ Phase
 * 17B.4 nhưng chưa từng có UI gọi tới — chỉ còn thiếu lớp giao diện.
 *
 * LIMITATION đã audit: `QueryCommentModerationDto` chỉ nhận `filmId`/`userId` (2 MongoId cụ thể),
 * KHÔNG có tham số tìm theo nội dung bình luận — không xây ô tìm kiếm giả (gõ nội dung sẽ không lọc
 * được gì, gây hiểu lầm là bug). Danh sách hiện toàn bộ bình luận mới nhất trước, phân trang thật.
 */
export function AdminCommentListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const visibilityMutation = useCommentVisibilityMutation();
  const removeMutation = useCommentRemoveMutation();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<CommentModerationItem | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...commentsQueryOptions.moderation({ page, limit: PAGE_LIMIT }, accessToken),
    placeholderData: keepPreviousData,
  });
  const comments = data?.items ?? [];

  const toggleVisibility = (comment: CommentModerationItem) => {
    visibilityMutation.mutate(
      { id: comment._id, isHidden: !comment.isHidden },
      {
        onSuccess: () => {
          notify.success(comment.isHidden ? 'Đã hiện lại bình luận.' : 'Đã ẩn bình luận.');
        },
        onError: (error) => {
          notify.error(error instanceof ApiRequestError ? error.message : 'Thao tác thất bại.');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Kiểm duyệt bình luận</h1>
        <p className="text-body-md text-on-surface-variant">
          {data ? `${data.meta.totalItems.toLocaleString('vi-VN')} bình luận` : 'Đang tải...'}
        </p>
      </div>

      {isError ? (
        <ErrorState message="Không tải được danh sách bình luận." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState icon="forum" message="Chưa có bình luận nào." />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden lg:block">
              <AdminTable columns={TABLE_COLUMNS}>
                {comments.map((comment) => (
                  <tr key={comment._id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-md py-sm font-bold text-on-surface whitespace-nowrap">
                      {comment.user.name}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      <Link
                        href={`/phim/${comment.film.slug}`}
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        {comment.film.title}
                      </Link>
                    </td>
                    <td className="px-md py-sm max-w-[320px] text-on-surface-variant line-clamp-2">
                      {comment.content}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
                      {comment.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
                      {formatDate(comment.createdAt)}
                    </td>
                    <td className="px-md py-sm">
                      <div className="flex items-center gap-sm">
                        <button
                          type="button"
                          onClick={() => toggleVisibility(comment)}
                          className="text-primary hover:underline text-label-md font-bold whitespace-nowrap"
                        >
                          {comment.isHidden ? 'Hiện' : 'Ẩn'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(comment)}
                          className="text-error hover:underline text-label-md font-bold"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>

            <div className="flex flex-col gap-sm lg:hidden">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
                >
                  <div className="flex items-center justify-between gap-sm">
                    <p className="font-bold text-on-surface">{comment.user.name}</p>
                    <span className="text-label-md text-on-surface-variant">
                      {comment.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                    </span>
                  </div>
                  <Link
                    href={`/phim/${comment.film.slug}`}
                    target="_blank"
                    className="text-primary hover:underline text-label-md"
                  >
                    {comment.film.title}
                  </Link>
                  <p className="text-body-md text-on-surface-variant line-clamp-2">
                    {comment.content}
                  </p>
                  <p className="text-label-md text-on-surface-variant">
                    {formatDate(comment.createdAt)}
                  </p>
                  <div className="flex items-center gap-md mt-1">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(comment)}
                      className="text-primary hover:underline text-label-md font-bold"
                    >
                      {comment.isHidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(comment)}
                      className="text-error hover:underline text-label-md font-bold"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data && data.meta.totalPages > 1 ? (
            <Pagination
              currentPage={data.meta.page}
              pages={[data.meta.page]}
              lastPage={data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá bình luận"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn bình luận của "${deleteTarget.user.name}"? Không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xoá"
        isLoading={removeMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeMutation.mutate(
            { id: deleteTarget._id, filmId: deleteTarget.film._id, parent: deleteTarget.parent },
            {
              onSuccess: () => {
                notify.success('Đã xoá bình luận.');
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá bình luận thất bại.',
                );
                setDeleteTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
