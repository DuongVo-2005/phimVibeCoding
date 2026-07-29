import type {
  CreateImgAvatarInput,
  CreateTypeAvatarInput,
  ImgAvatar,
  TypeAvatar,
} from '@/lib/types/avatar';
import { request } from './client';
import { AVATARS_ENDPOINTS } from './endpoints';

export const avatarsApi = {
  types() {
    return request<TypeAvatar[]>(AVATARS_ENDPOINTS.types);
  },

  images(typeId?: string) {
    return request<ImgAvatar[]>(AVATARS_ENDPOINTS.images, { query: { typeId } });
  },

  createType(body: CreateTypeAvatarInput, accessToken: string) {
    return request<TypeAvatar>(AVATARS_ENDPOINTS.types, { method: 'POST', body, accessToken });
  },

  createImage(body: CreateImgAvatarInput, accessToken: string) {
    return request<ImgAvatar>(AVATARS_ENDPOINTS.images, { method: 'POST', body, accessToken });
  },

  removeType(id: string, accessToken: string) {
    return request<null>(AVATARS_ENDPOINTS.typeById(id), { method: 'DELETE', accessToken });
  },

  removeImage(id: string, accessToken: string) {
    return request<null>(AVATARS_ENDPOINTS.imageById(id), { method: 'DELETE', accessToken });
  },
};
