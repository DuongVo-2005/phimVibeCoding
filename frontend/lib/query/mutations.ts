import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { PaginationQueryParams } from '@/lib/api/types';
import { commentsApi } from '@/lib/api/comments';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import { favoritesApi } from '@/lib/api/favorites';
import { historiesApi } from '@/lib/api/histories';
import { ratingsApi } from '@/lib/api/ratings';
import type { Comment } from '@/lib/types/comment';
import type { PaginatedResponse } from '@/lib/types/common';
import type { Favorite, FavoriteTargetType } from '@/lib/types/favorite';
import type { History } from '@/lib/types/history';
import type { Rating, RatingSummary } from '@/lib/types/rating';
import { queryKeys } from './keys';

interface ToggleFavoriteVariables {
  targetType: FavoriteTargetType;
  targetId: string;
  /** Trạng thái NGAY TRƯỚC khi bấm — quyết định gọi add hay remove. */
  isFavorited: boolean;
  /** Params đúng bằng params của `useQuery(favoritesQueryOptions.mine(listParams, ...))` đang đọc
   * — dùng để optimistic-patch/rollback ĐÚNG cache entry đó, không đoán. */
  listParams: FavoritesQueryParams;
}

interface ToggleFavoriteContext {
  previousData: PaginatedResponse<Favorite> | undefined;
  listParams: FavoritesQueryParams;
}

/**
 * Phase 14A: mutation hook ĐẦU TIÊN trong project — trước đó `lib/query/` chỉ có `queryOptions()`
 * đọc (xem comment đầu `options.ts`, Phase 11.3A: "Endpoint ghi... không thuộc phạm vi"). Đặt tại
 * `lib/query/mutations.ts` — cùng layer-first convention với `client/keys/defaults/options.ts`.
 *
 * Optimistic update: `onMutate` patch trực tiếp mảng `items` của cache `favorites.mine(listParams)`
 * (thêm 1 bản ghi tối giản khi add, lọc bỏ khi remove — không gọi lại API để lấy bản ghi thật, vì
 * mục đích chỉ là phản ánh trạng thái "đã yêu thích" tức thời cho UI, không hiển thị danh sách đầy
 * đủ ở phase này). Rollback bằng `previousData` đã snapshot nếu `mutationFn` lỗi. `onSettled` luôn
 * `invalidateQueries` theo `queryKeys.favorites.all()` — CHỈ domain `favorites`, không đụng cache
 * film/comment/rating/history nào khác.
 */
export function useFavoriteMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Favorite | null, Error, ToggleFavoriteVariables, ToggleFavoriteContext>({
    mutationFn: async ({ targetType, targetId, isFavorited }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để dùng Favorite.');
      }

      if (isFavorited) {
        await favoritesApi.remove(targetType, targetId, accessToken);
        return null;
      }

      return favoritesApi.add({ targetType, target: targetId }, accessToken);
    },

    onMutate: async ({ targetType, targetId, isFavorited, listParams }) => {
      const queryKey = queryKeys.favorites.mine(listParams);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<PaginatedResponse<Favorite>>(queryKey);

      if (previousData) {
        const nextItems = isFavorited
          ? previousData.items.filter((favorite) => favorite.target?._id !== targetId)
          : [
              {
                _id: `optimistic-${targetId}`,
                targetType,
                // Chỉ cần `_id` để check "đã favorite chưa" (xem useFavorite.ts) — KHÔNG dùng để
                // hiển thị danh sách đầy đủ (title/poster...) ở phase này nên không cần resolve
                // đủ field thật, sẽ được thay bằng dữ liệu thật ngay sau `invalidateQueries`.
                target: { _id: targetId } as Favorite['target'],
                createdAt: new Date().toISOString(),
              },
              ...previousData.items,
            ];

        queryClient.setQueryData<PaginatedResponse<Favorite>>(queryKey, {
          ...previousData,
          items: nextItems,
        });
      }

      return { previousData, listParams };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.favorites.mine(context.listParams),
          context.previousData,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all() });
    },
  });
}

interface SetRatingVariables {
  filmId: string;
  score: number;
}

interface SetRatingContext {
  previousSummary: RatingSummary | undefined;
  previousMine: Rating | null | undefined;
}

/**
 * Phase 14B: mutation thứ 2 trong `lib/query/mutations.ts` — cùng pattern `useFavoriteMutation`.
 * `ratingsApi.create()` là upsert (1 route POST cho cả tạo mới/sửa, xem `ratings.controller.ts`) —
 * `mutationFn` luôn gọi `create`, không cần tự phân biệt add/update ở tầng gọi API.
 *
 * Optimistic update: `onMutate` đọc `previousMine` từ cache `ratings.mine(filmId)` để biết đây là
 * đánh giá MỚI hay SỬA (quyết định `count` có tăng hay không) — điểm này trước đây (audit Phase
 * 11.6C) bị coi là rủi ro vì không chắc client biết trạng thái cũ, nhưng ở đây `useRating` luôn đọc
 * `ratings.mine` trước khi cho phép bấm nên cache đã có sẵn, tính trung bình mới an toàn:
 * `nextAverage = (oldAverage*oldCount - oldScore(nếu sửa) + newScore) / nextCount`.
 */
export function useRatingMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Rating, Error, SetRatingVariables, SetRatingContext>({
    mutationFn: async ({ filmId, score }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để đánh giá.');
      }

      return ratingsApi.create(filmId, { score }, accessToken);
    },

    onMutate: async ({ filmId, score }) => {
      const summaryKey = queryKeys.ratings.summary(filmId);
      const mineKey = queryKeys.ratings.mine(filmId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: summaryKey }),
        queryClient.cancelQueries({ queryKey: mineKey }),
      ]);

      const previousSummary = queryClient.getQueryData<RatingSummary>(summaryKey);
      const previousMine = queryClient.getQueryData<Rating | null>(mineKey);
      const previousScore = previousMine?.score ?? null;
      const isNewRating = previousScore === null;

      if (previousSummary) {
        const nextCount = isNewRating ? previousSummary.count + 1 : previousSummary.count;
        const previousTotal = previousSummary.average * previousSummary.count;
        const nextTotal = isNewRating
          ? previousTotal + score
          : previousTotal - previousScore + score;

        queryClient.setQueryData<RatingSummary>(summaryKey, {
          average: nextCount > 0 ? nextTotal / nextCount : 0,
          count: nextCount,
        });
      }

      queryClient.setQueryData<Rating | null>(mineKey, (current) => ({
        _id: current?._id ?? 'optimistic',
        film: filmId,
        user: current?.user ?? '',
        score,
        createdAt: current?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return { previousSummary, previousMine };
    },

    onError: (_error, { filmId }, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.ratings.summary(filmId), context.previousSummary);
        queryClient.setQueryData(queryKeys.ratings.mine(filmId), context.previousMine);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all() });
    },
  });
}

interface SendCommentVariables {
  filmId: string;
  content: string;
}

interface SendCommentContext {
  previousData: PaginatedResponse<Comment> | undefined;
}

/**
 * Phase 14C: mutation thứ 3 trong `lib/query/mutations.ts` — cùng pattern 2 hook trên. CHỈ gửi
 * bình luận gốc (`parent` luôn bỏ trống) — không Reply/Vote/Edit/Delete.
 *
 * Optimistic update: `onMutate` chèn 1 bản ghi tối giản vào ĐẦU mảng `items` của cache
 * `comments.byFilm(filmId)` (không truyền `params` — đúng key mà `useComment` đang đọc, xem
 * `hooks/useComment.ts`) — `user.name`/`user._id` lấy từ `session.user` hiện tại (đúng yêu cầu
 * "avatar/name lấy từ session"; `avatar` để `undefined` vì `AuthUser` (session) KHÔNG có field này
 * — không tạo avatar giả). Rollback bằng `previousData` nếu lỗi.
 */
export function useCommentMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Comment, Error, SendCommentVariables, SendCommentContext>({
    mutationFn: async ({ filmId, content }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để bình luận.');
      }

      return commentsApi.create({ film: filmId, content }, accessToken);
    },

    onMutate: async ({ filmId, content }) => {
      const queryKey = queryKeys.comments.byFilm(filmId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<PaginatedResponse<Comment>>(queryKey);

      if (previousData) {
        const optimisticComment: Comment = {
          _id: `optimistic-${Date.now()}`,
          film: filmId,
          user: {
            _id: session?.user?.id ?? '',
            name: session?.user?.name ?? '',
          },
          content,
          parent: null,
          upVoteCount: 0,
          downVoteCount: 0,
          isHidden: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<PaginatedResponse<Comment>>(queryKey, {
          ...previousData,
          items: [optimisticComment, ...previousData.items],
          meta: { ...previousData.meta, totalItems: previousData.meta.totalItems + 1 },
        });
      }

      return { previousData };
    },

    onError: (_error, { filmId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.byFilm(filmId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all() });
    },
  });
}

interface RemoveHistoryVariables {
  filmId: string;
  /** Params ĐÚNG bằng params của `useQuery(historiesQueryOptions.recent(listParams, ...))` đang
   * đọc ở nơi gọi — dùng để optimistic-patch/rollback ĐÚNG cache entry đó, cùng nguyên tắc
   * `useFavoriteMutation` (`listParams`) — homepage/dashboard/trang `/user/lich-su` mỗi nơi đọc 1
   * `queryKey` khác nhau (limit khác nhau) nên phải khớp chính xác, không đoán. */
  listParams: PaginationQueryParams | undefined;
}

interface RemoveHistoryContext {
  previousData: PaginatedResponse<History> | undefined;
  listParams: PaginationQueryParams | undefined;
}

/**
 * Phase 17B.2: mutation ĐẦU TIÊN cho domain `histories` — trước đó `historiesApi.remove()` tồn
 * tại ở tầng API client (Phase 11.2) nhưng chưa có nơi nào gọi tới. Cùng pattern
 * `useFavoriteMutation`/`useCommentMutation`: optimistic lọc bỏ khỏi cache
 * `historiesQueryOptions.recent(listParams)` đang đọc, rollback bằng `previousData` nếu lỗi,
 * `onSettled` luôn `invalidateQueries` theo `queryKeys.histories.all()` (mọi listParams khác nhau
 * — homepage/dashboard/trang lịch sử đầy đủ — đều được làm mới, không cần `refetch()` thủ công ở
 * bất kỳ nơi gọi nào).
 */
export function useRemoveHistoryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, RemoveHistoryVariables, RemoveHistoryContext>({
    mutationFn: async ({ filmId }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để xoá lịch sử xem.');
      }

      return historiesApi.remove(filmId, accessToken);
    },

    onMutate: async ({ filmId, listParams }) => {
      const queryKey = queryKeys.histories.recent(listParams);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<PaginatedResponse<History>>(queryKey);

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<History>>(queryKey, {
          ...previousData,
          items: previousData.items.filter((history) => history.film._id !== filmId),
        });
      }

      return { previousData, listParams };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.histories.recent(context.listParams),
          context.previousData,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.histories.all() });
    },
  });
}
