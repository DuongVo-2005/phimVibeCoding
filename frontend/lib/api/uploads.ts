import type { UploadPurpose, UploadResult } from '@/lib/types/upload';
import type { ApiSuccessResponse, ErrorResponse } from '@/lib/types/common';
import { apiBaseUrl, ApiRequestError, request } from './client';
import { UPLOADS_ENDPOINTS } from './endpoints';

/**
 * uploadsApi — Phase 31 (v1.1). `uploadImage` KHÔNG dùng `request()` dùng chung (client.ts) vì 2
 * lý do:
 * 1. `request()` luôn set `Content-Type: application/json` + `JSON.stringify(body)` — không hợp
 *    với multipart/form-data (file).
 * 2. Yêu cầu "Progress" — `fetch()` không có sự kiện tiến trình upload; chỉ `XMLHttpRequest` có
 *    `upload.onprogress`, nên phải tự dựng bằng XHR thay vì tái dùng `fetch()`-based `request()`.
 * Vẫn tái dùng ĐÚNG quy ước unwrap envelope `{success,data}`/`{success:false,...}` +
 * `ApiRequestError` như `request()` để lỗi hiển thị nhất quán với phần còn lại của app.
 */
export const uploadsApi = {
  uploadImage(
    file: File,
    purpose: UploadPurpose,
    accessToken: string,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${apiBaseUrl}${UPLOADS_ENDPOINTS.image}`);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let json: ApiSuccessResponse<UploadResult> | ErrorResponse;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {
          reject(new ApiRequestError(xhr.status, 'Phản hồi không hợp lệ từ server'));
          return;
        }

        if (!json.success) {
          const message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
          reject(new ApiRequestError(json.statusCode, message));
          return;
        }

        resolve(json.data);
      };

      xhr.onerror = () => reject(new ApiRequestError(0, 'Lỗi kết nối, vui lòng thử lại'));

      xhr.send(formData);
    });
  },

  remove(url: string, accessToken: string) {
    return request<null>(UPLOADS_ENDPOINTS.base, { method: 'DELETE', body: { url }, accessToken });
  },
};
