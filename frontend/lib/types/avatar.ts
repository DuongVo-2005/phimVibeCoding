/** Khớp `avatars/schemas/*.schema.ts` thật (Phase 19B.10). Chỉ Create+Delete — backend không có
 * route Update cho cả 2 sub-resource (đã audit `avatars.controller.ts`). */
export interface TypeAvatar {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ImgAvatar {
  _id: string;
  type: string;
  url: string;
  createdAt: string;
}

export interface CreateTypeAvatarInput {
  name: string;
}

export interface CreateImgAvatarInput {
  type: string;
  url: string;
}
