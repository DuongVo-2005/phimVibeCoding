/** Khớp `UploadPurpose` (backend/src/common/constants/index.ts) — chỉ gồm nơi THẬT SỰ cần ảnh
 * trong dự án hiện tại (`Film.posterUrl`/`thumbUrl`, `Actor`/`Director.avatar`, `ImgAvatar.url`). */
export type UploadPurpose = 'poster' | 'thumbnail' | 'avatar';

/** Khớp `UploadResponseDto{url,filename,mimeType,size}` — api_design.md §24. */
export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}
