import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { PaginationQueryParams } from '@/lib/api/types';
import { actorsApi } from '@/lib/api/actors';
import { categoriesApi } from '@/lib/api/categories';
import { commentsApi } from '@/lib/api/comments';
import { countriesApi } from '@/lib/api/countries';
import { directorsApi } from '@/lib/api/directors';
import { episodesApi } from '@/lib/api/episodes';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import { favoritesApi } from '@/lib/api/favorites';
import { filmsApi } from '@/lib/api/films';
import { historiesApi } from '@/lib/api/histories';
import { notificationsApi } from '@/lib/api/notifications';
import { ratingsApi } from '@/lib/api/ratings';
import type { ActorDetail, CreateActorInput, UpdateActorInput } from '@/lib/types/actor';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/types/category';
import type { Comment, CommentVoteType } from '@/lib/types/comment';
import type { PaginatedResponse } from '@/lib/types/common';
import type { Country, CreateCountryInput, UpdateCountryInput } from '@/lib/types/country';
import type {
  CreateDirectorInput,
  DirectorDetail,
  UpdateDirectorInput,
} from '@/lib/types/director';
import type { Favorite, FavoriteTargetType } from '@/lib/types/favorite';
import type { CreateEpisodeInput, Episode, UpdateEpisodeInput } from '@/lib/types/episode';
import type { CreateFilmInput, FilmDetail, UpdateFilmInput } from '@/lib/types/film';
import type { History } from '@/lib/types/history';
import type { Notification } from '@/lib/types/notification';
import type { Rating, RatingSummary } from '@/lib/types/rating';
import type { AppUserRole, CreateUserByAdminInput, UserProfile } from '@/lib/types/user';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import type { CreateRoleInput, Role, UpdateRoleInput } from '@/lib/types/role';
import type { Permission } from '@/lib/types/permission';
import { avatarsApi } from '@/lib/api/avatars';
import type {
  CreateImgAvatarInput,
  CreateTypeAvatarInput,
  ImgAvatar,
  TypeAvatar,
} from '@/lib/types/avatar';
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
      // Phase 18: `film.ratingAvg`/`film.ratingCount` (denormalized trên FilmSummary, hiện trên
      // MovieCard/TopRatedSection ở nơi khác) cũng phải làm mới — trước đây chỉ invalidate domain
      // `ratings`, khiến số liệu hiện trên thẻ phim bị cũ tới khi hết staleTime (audit Phase 18
      // phát hiện). Không cache theo `filmId` riêng — `films.all()` phủ mọi list/detail liên quan,
      // đúng mức độ "khớp cache" mà kiến trúc hiện có hỗ trợ (không optimistic riêng field này,
      // không đáng để thêm phức tạp).
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

interface SendCommentVariables {
  filmId: string;
  content: string;
  /** Phase 17B.4: có giá trị khi đây là REPLY (trả lời 1 comment gốc), bỏ trống khi là bình luận
   * gốc — khớp `CreateCommentDto.parent` optional thật (BE dùng CHUNG endpoint `POST /comments` cho
   * cả 2 trường hợp, chỉ khác `parent` có/không, xem `comments.service.ts`'s `create()`). */
  parent?: string;
}

interface SendCommentContext {
  previousData?: PaginatedResponse<Comment>;
}

/**
 * Phase 14C: mutation thứ 3 trong `lib/query/mutations.ts` — cùng pattern 2 hook trên. CHỈ gửi
 * bình luận gốc (`parent` luôn bỏ trống) — không Reply/Vote/Edit/Delete.
 *
 * Phase 17B.4: thêm `parent` (tuỳ chọn) để tái dùng CHÍNH mutation này cho Reply (đúng yêu cầu
 * "Reuse backend parent comment API", "No duplicated mutation") — KHÔNG tạo mutation "sendReply"
 * riêng. Optimistic CHỈ áp dụng khi `parent` rỗng (bình luận gốc, cache `byFilm` sort
 * `createdAt:-1` — prepend vào đầu là đúng vị trí). Khi có `parent` (reply), backend sort
 * `findReplies` theo `createdAt:1` (CŨ nhất trước) — reply mới phải nằm ở CUỐI danh sách, mà
 * không biết chắc người dùng đang xem trang cuối hay chưa (`replies` có phân trang riêng, trang
 * hiện tại do `CommentItem` tự quản lý) nên KHÔNG optimistic-patch cache `replies` (tránh chèn sai
 * vị trí) — chỉ dựa vào `onSettled` → `invalidateQueries(comments.all())` để làm mới đúng dữ liệu
 * thật, đúng nhánh "otherwise invalidateQueries" mà yêu cầu đã cho phép.
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
    mutationFn: async ({ filmId, content, parent }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để bình luận.');
      }

      return commentsApi.create({ film: filmId, content, parent }, accessToken);
    },

    onMutate: async ({ filmId, content, parent }) => {
      if (parent) {
        return {};
      }

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

    onError: (_error, { filmId, parent }, context) => {
      if (!parent && context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.byFilm(filmId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all() });
      // Phase 18: `film.commentCount` (denormalized trên FilmSummary, quyết định thứ tự
      // MostCommentedSection) cũng phải làm mới cùng lúc — trước đây chỉ invalidate domain
      // `comments`, cùng lỗ hổng cache đã sửa cho `useRatingMutation` (xem ghi chú ở đó).
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

interface CommentActionVariables {
  id: string;
  filmId: string;
  /** `null` khi thao tác trên bình luận GỐC, khác `null` khi thao tác trên 1 REPLY — dùng để biết
   * nên optimistic-patch cache `byFilm(filmId)` hay bỏ qua optimistic (xem ghi chú tại từng
   * mutation bên dưới). */
  parent: string | null;
}

interface UpdateCommentVariables extends CommentActionVariables {
  content: string;
}

interface CommentCacheContext {
  previousData?: PaginatedResponse<Comment>;
}

/**
 * Phase 17B.4: mutation MỚI (chưa từng có `update` nào gọi `commentsApi.update` trước phase này —
 * không phải trùng lặp). Chỉ optimistic khi sửa bình luận GỐC (`parent` rỗng) — cache
 * `byFilm(filmId)` là 1 key cố định, patch trực tiếp phần tử khớp `id` an toàn. Khi sửa 1 REPLY,
 * cache `replies(parent, params)` phụ thuộc `params` phân trang do `CommentItem` tự quản lý (không
 * truyền xuống đây) — không đoán đúng key nên bỏ qua optimistic, dựa vào `invalidateQueries`
 * (nhánh "otherwise" mà yêu cầu cho phép).
 */
export function useCommentUpdateMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Comment, Error, UpdateCommentVariables, CommentCacheContext>({
    mutationFn: async ({ id, content }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để sửa bình luận.');
      }

      return commentsApi.update(id, { content }, accessToken);
    },

    onMutate: async ({ id, filmId, parent, content }) => {
      if (parent) {
        return {};
      }

      const queryKey = queryKeys.comments.byFilm(filmId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<PaginatedResponse<Comment>>(queryKey);

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Comment>>(queryKey, {
          ...previousData,
          items: previousData.items.map((comment) =>
            comment._id === id ? { ...comment, content, isEdited: true } : comment,
          ),
        });
      }

      return { previousData };
    },

    onError: (_error, { filmId, parent }, context) => {
      if (!parent && context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.byFilm(filmId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all() });
      // Phase 18: `film.commentCount` (denormalized trên FilmSummary, quyết định thứ tự
      // MostCommentedSection) cũng phải làm mới cùng lúc — trước đây chỉ invalidate domain
      // `comments`, cùng lỗ hổng cache đã sửa cho `useRatingMutation` (xem ghi chú ở đó).
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

/** Phase 17B.4: mutation MỚI cho `commentsApi.remove` — cùng nguyên tắc optimistic như
 * `useCommentUpdateMutation` ở trên (chỉ patch khi xoá bình luận GỐC). */
export function useCommentRemoveMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, CommentActionVariables, CommentCacheContext>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để xoá bình luận.');
      }

      return commentsApi.remove(id, accessToken);
    },

    onMutate: async ({ id, filmId, parent }) => {
      if (parent) {
        return {};
      }

      const queryKey = queryKeys.comments.byFilm(filmId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<PaginatedResponse<Comment>>(queryKey);

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Comment>>(queryKey, {
          ...previousData,
          items: previousData.items.filter((comment) => comment._id !== id),
          meta: { ...previousData.meta, totalItems: Math.max(previousData.meta.totalItems - 1, 0) },
        });
      }

      return { previousData };
    },

    onError: (_error, { filmId, parent }, context) => {
      if (!parent && context?.previousData) {
        queryClient.setQueryData(queryKeys.comments.byFilm(filmId), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all() });
      // Phase 18: `film.commentCount` (denormalized trên FilmSummary, quyết định thứ tự
      // MostCommentedSection) cũng phải làm mới cùng lúc — trước đây chỉ invalidate domain
      // `comments`, cùng lỗ hổng cache đã sửa cho `useRatingMutation` (xem ghi chú ở đó).
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

interface VoteCommentVariables extends CommentActionVariables {
  voteType: CommentVoteType;
}

/**
 * Phase 17B.4: mutation MỚI cho `commentsApi.vote`. KHÔNG optimistic (kể cả bình luận gốc) — khác
 * với update/remove ở trên: `POST /comments/:id/vote` là TOGGLE 3 trạng thái (chưa vote → vote,
 * cùng loại → bỏ vote, khác loại → đổi loại, xem `comments.service.ts`'s `vote()`) và FE không có
 * cách biết người dùng ĐÃ vote loại nào trước đó (backend không trả field này ở bất kỳ endpoint
 * nào) — không thể tính đúng delta optimistic (+1/-1/đổi) mà chỉ đoán mò, rủi ro hiện sai số đếm.
 * Vì vậy chỉ gọi mutation rồi `invalidateQueries` lấy số liệu thật.
 */
export function useCommentVoteMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Comment, Error, VoteCommentVariables>({
    mutationFn: async ({ id, voteType }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để vote bình luận.');
      }

      return commentsApi.vote(id, { voteType }, accessToken);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all() });
      // Phase 18: `film.commentCount` (denormalized trên FilmSummary, quyết định thứ tự
      // MostCommentedSection) cũng phải làm mới cùng lúc — trước đây chỉ invalidate domain
      // `comments`, cùng lỗ hổng cache đã sửa cho `useRatingMutation` (xem ghi chú ở đó).
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

/** Phase 19B.7 (Admin Comment Moderation): mutation MỚI cho `commentsApi.setVisibility` —
 * `PATCH /comments/:id/visibility`, admin-only, đã có sẵn API client từ Phase 17B.4 nhưng chưa có
 * UI gọi tới. KHÔNG optimistic — chỉ invalidate `comments.all()` (phủ cả cache
 * `comments.moderation(...)` lẫn `comments.byFilm(...)` vì cùng tiền tố, xem `queryKeys.ts`), khớp
 * đúng việc ẩn/hiện phải phản ánh ở CẢ trang quản trị lẫn trang phim công khai. */
export function useCommentVisibilityMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Comment, Error, { id: string; isHidden: boolean }>({
    mutationFn: async ({ id, isHidden }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để ẩn/hiện bình luận.');
      }
      return commentsApi.setVisibility(id, { isHidden }, accessToken);
    },
    onSuccess: () => {
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

/**
 * Phase 19B.2 (Admin Movie Create/Edit/Delete): 3 mutation MỚI cho `filmsApi.create/update/remove`
 * — API client đã có sẵn từ Phase 11.2 nhưng chưa có UI nào gọi tới. KHÔNG optimistic (khác
 * favorite/rating/comment ở trên) — đây là thao tác quản trị tần suất thấp, sau khi submit luôn
 * điều hướng đi (về danh sách) chứ không cần phản hồi tức thời tại chỗ; `onSuccess` chỉ
 * `invalidateQueries(films.all())` để danh sách/chi tiết đọc lại đúng dữ liệu thật.
 */
export function useCreateFilmMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<FilmDetail, Error, CreateFilmInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo phim.');
      }
      return filmsApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

export function useUpdateFilmMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<FilmDetail, Error, { id: string; body: UpdateFilmInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật phim.');
      }
      return filmsApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

export function useDeleteFilmMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá phim.');
      }
      return filmsApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.films.all() });
    },
  });
}

/** Phase 19B.3 (Admin Category Management): cùng nguyên tắc `useCreateFilmMutation` ở trên — KHÔNG
 * optimistic (thao tác quản trị tần suất thấp), `onSuccess` chỉ invalidate `categories.all()`. */
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Category, Error, CreateCategoryInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo thể loại.');
      }
      return categoriesApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Category, Error, { id: string; body: UpdateCategoryInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật thể loại.');
      }
      return categoriesApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá thể loại.');
      }
      return categoriesApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}

/** Phase 19B.4 (Admin Country Management): cùng nguyên tắc `useCreateCategoryMutation` ở trên. */
export function useCreateCountryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Country, Error, CreateCountryInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo quốc gia.');
      }
      return countriesApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.all() });
    },
  });
}

export function useUpdateCountryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Country, Error, { id: string; body: UpdateCountryInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật quốc gia.');
      }
      return countriesApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.all() });
    },
  });
}

export function useDeleteCountryMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá quốc gia.');
      }
      return countriesApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.all() });
    },
  });
}

/** Phase 19B.5 (Admin Actor Management): cùng nguyên tắc `useCreateCountryMutation` ở trên. */
export function useCreateActorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<ActorDetail, Error, CreateActorInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo diễn viên.');
      }
      return actorsApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actors.all() });
    },
  });
}

export function useUpdateActorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<ActorDetail, Error, { id: string; body: UpdateActorInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật diễn viên.');
      }
      return actorsApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actors.all() });
    },
  });
}

export function useDeleteActorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá diễn viên.');
      }
      return actorsApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actors.all() });
    },
  });
}

/** Phase 19B.6 (Admin Director Management): cùng nguyên tắc `useCreateActorMutation` ở trên.
 * `directorsApi` đã có sẵn từ Phase 19B.2 (ô chọn đạo diễn trong `MovieForm`). */
export function useCreateDirectorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<DirectorDetail, Error, CreateDirectorInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo đạo diễn.');
      }
      return directorsApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directors.all() });
    },
  });
}

export function useUpdateDirectorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<DirectorDetail, Error, { id: string; body: UpdateDirectorInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật đạo diễn.');
      }
      return directorsApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directors.all() });
    },
  });
}

export function useDeleteDirectorMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá đạo diễn.');
      }
      return directorsApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directors.all() });
    },
  });
}

/** Phase 19B.8 (Admin User Management): `updateRole`/`updateStatus`/`remove` đều tự chặn admin
 * thao tác lên CHÍNH TÀI KHOẢN đang đăng nhập ở backend (`ensureNotSelf()`, ném `ConflictException`
 * — xem `users.service.ts`) — UI vẫn nên tự vô hiệu hoá nút ở dòng của chính admin (so sánh
 * `session.user.id`) để tránh round-trip lỗi, nhưng KHÔNG bỏ qua guard backend (defense-in-depth,
 * cùng nguyên tắc `RoleGuard` + middleware ở Admin Foundation). */
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<UserProfile, Error, CreateUserByAdminInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo người dùng.');
      }
      return usersApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<UserProfile, Error, { id: string; role: AppUserRole }>({
    mutationFn: async ({ id, role }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để đổi role.');
      }
      return usersApi.updateRole(id, { role }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<UserProfile, Error, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để đổi trạng thái.');
      }
      return usersApi.updateStatus(id, { isActive }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá người dùng.');
      }
      return usersApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

/** Phase 19B.9 (Admin Role/Permission Management): cùng nguyên tắc các mutation admin khác ở
 * trên. `useSetRolePermissionsMutation` invalidate riêng `roles.detail(id)` (chứa
 * `permissionKeys`) THAY VÌ toàn bộ `roles.all()` — đủ và hẹp hơn, tránh refetch lại `roles.list()`
 * không cần thiết (list không hiển thị chi tiết quyền). */
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Role, Error, CreateRoleInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo role.');
      }
      return rolesApi.create(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Role, Error, { id: string; body: UpdateRoleInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để cập nhật role.');
      }
      return rolesApi.update(id, body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá role.');
      }
      return rolesApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
    },
  });
}

export function useSetRolePermissionsMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Permission[], Error, { id: string; permissionIds: string[] }>({
    mutationFn: async ({ id, permissionIds }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để gán quyền.');
      }
      return rolesApi.setPermissions(id, permissionIds, accessToken);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(id) });
    },
  });
}

/** Phase 19B.10 (Admin Avatar Management): cùng nguyên tắc các mutation admin khác — không
 * optimistic, chỉ invalidate sau khi thành công. */
export function useCreateAvatarTypeMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<TypeAvatar, Error, CreateTypeAvatarInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để tạo loại avatar.');
      }
      return avatarsApi.createType(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatars.all() });
    },
  });
}

export function useCreateAvatarImageMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<ImgAvatar, Error, CreateImgAvatarInput>({
    mutationFn: async (body) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để thêm avatar.');
      }
      return avatarsApi.createImage(body, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatars.all() });
    },
  });
}

export function useDeleteAvatarTypeMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá loại avatar.');
      }
      return avatarsApi.removeType(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatars.all() });
    },
  });
}

export function useDeleteAvatarImageMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá avatar.');
      }
      return avatarsApi.removeImage(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatars.all() });
    },
  });
}

/** Phase 34 (Notification Center) — cả 3 mutation dưới đây đều invalidate NGUYÊN `notifications.
 * all()` (không hẹp theo từng `list(params)`) — badge chuông (dropdown, `limit` nhỏ) và trang đầy
 * đủ (`/user/thong-bao`, có phân trang/filter riêng) dùng 2 query key khác nhau nhưng cùng cần cập
 * nhật lại `unreadCount` sau bất kỳ thao tác đọc/xoá nào — invalidate hẹp sẽ bỏ sót 1 trong 2 nơi. */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Notification, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để đánh dấu đã đọc.');
      }
      return notificationsApi.markRead(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<{ updated: number }, Error, void>({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để đánh dấu đã đọc.');
      }
      return notificationsApi.markAllRead(accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập để xoá thông báo.');
      }
      return notificationsApi.remove(id, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}

/** Phase 35 (Episode Management API) — cả 4 mutation dưới đây nhận `filmId` tường minh trong
 * variables (không suy ra từ response, `remove`/`updateOrder` có thể không trả đủ) để invalidate
 * ĐÚNG `queryKeys.episodes.byFilm(filmId)` — danh sách tập của đúng phim đang sửa tự refetch ngay
 * sau mỗi thao tác, khớp yêu cầu "Reload persistence" (không cần F5 thủ công mới thấy thay đổi). */
export function useCreateEpisodeMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Episode, Error, { filmId: string; body: CreateEpisodeInput }>({
    mutationFn: async ({ filmId, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để thêm tập phim.');
      }
      return episodesApi.create(filmId, body, accessToken);
    },
    onSuccess: (_result, { filmId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodes.byFilm(filmId) });
    },
  });
}

export function useUpdateEpisodeMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Episode, Error, { id: string; filmId: string; body: UpdateEpisodeInput }>({
    mutationFn: async ({ id, body }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để sửa tập phim.');
      }
      return episodesApi.update(id, body, accessToken);
    },
    onSuccess: (_result, { filmId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodes.byFilm(filmId) });
    },
  });
}

export function useDeleteEpisodeMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<null, Error, { id: string; filmId: string }>({
    mutationFn: async ({ id }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để xoá tập phim.');
      }
      return episodesApi.remove(id, accessToken);
    },
    onSuccess: (_result, { filmId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodes.byFilm(filmId) });
    },
  });
}

export function useUpdateEpisodeOrderMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  return useMutation<Episode, Error, { id: string; filmId: string; displayOrder: number }>({
    mutationFn: async ({ id, displayOrder }) => {
      if (!accessToken) {
        throw new Error('Yêu cầu đăng nhập admin để sắp xếp lại tập phim.');
      }
      return episodesApi.updateOrder(id, displayOrder, accessToken);
    },
    onSuccess: (_result, { filmId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodes.byFilm(filmId) });
    },
  });
}
