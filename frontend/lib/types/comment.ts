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
