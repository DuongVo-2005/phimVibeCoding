/**
 * Khớp `comments/schemas/comment.schema.ts` thật (Phase 11.0 audit) — `film,user,content,parent,
 * upVoteCount,downVoteCount,isHidden`. `user` populate `name,avatar` (đã xác nhận qua
 * `comments.controller.ts` — `GET /comments/film/:filmId` "user populated name,avatar").
 * `isEdited` chỉ xuất hiện trong response của `PATCH /comments/:id` (không phải field lưu DB
 * thật, chỉ thêm khi trả response edit) — để optional.
 */
export interface Comment {
  _id: string;
  film: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  parent: string | null;
  upVoteCount: number;
  downVoteCount: number;
  isHidden: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  film: string;
  content: string;
  parent?: string;
}

export interface UpdateCommentInput {
  content: string;
}

export type CommentVoteType = 'up' | 'down';

export interface VoteCommentInput {
  voteType: CommentVoteType;
}

export interface SetCommentVisibilityInput {
  isHidden: boolean;
}

/**
 * Phase 19B.7 (Admin Comment Moderation): shape THẬT KHÁC của `GET /comments` (moderation, admin-
 * only) — `comments.service.ts`'s `findAllForModeration()` populate CẢ `user` (name,avatar, giống
 * `Comment` thường) LẪN `film` (title,slug,posterUrl — khác hẳn `Comment.film` là chuỗi ID trần ở
 * `byFilm`/`replies`/`topVoted`/`latest`). Tách riêng type thay vì sửa `Comment.film` thành union —
 * đúng nguyên tắc đã áp dụng cho `FilmRef`/`FilmSummary` (Phase 11.2): shape khác nhau thật sự giữa
 * các endpoint thì tách type riêng, không gộp.
 */
export interface CommentModerationItem extends Omit<Comment, 'film'> {
  film: {
    _id: string;
    title: string;
    slug: string;
    posterUrl?: string;
  };
}
