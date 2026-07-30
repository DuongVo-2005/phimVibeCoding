import { request } from './client';
import { AUTH_ENDPOINTS } from './endpoints';
import type { AuthTokens } from './types';

/**
 * authApi — hoàn thiện Phase 11.1 (quyết định D): đủ 6 hàm khớp `AuthController` thật
 * (`register/login/refresh/logout/forgotPassword/resetPassword`). `register`/`login`/`refresh`
 * trả `AuthTokens` (khớp `AuthController_register`/`_handleLogin`/`_refresh` thật — cùng shape).
 * `logout`/`forgotPassword`/`resetPassword` trả `{message}` (khớp response thật, không có data
 * nghiệp vụ nào khác ngoài thông báo).
 *
 * `forgotPassword`/`resetPassword` chưa có UI gọi tới (quyết định D: không tạo UI Quên/Đặt lại
 * mật khẩu ở phase này) — chỉ hoàn thiện tầng API client theo đúng yêu cầu "authApi hoàn chỉnh".
 */
export const authApi = {
  register(email: string, password: string, name?: string) {
    return request<AuthTokens>(AUTH_ENDPOINTS.register, {
      method: 'POST',
      body: { email, password, name },
    });
  },

  login(email: string, password: string) {
    return request<AuthTokens>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      body: { email, password },
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      body: { refreshToken },
    });
  },

  logout(accessToken: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      accessToken,
    });
  },

  forgotPassword(email: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.forgotPassword, {
      method: 'POST',
      body: { email },
    });
  },

  resetPassword(token: string, newPassword: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.resetPassword, {
      method: 'POST',
      body: { token, newPassword },
    });
  },

  /** Phase 33 (Verify Email) — yêu cầu đăng nhập (khớp `@CurrentUser()` ở backend, không nhận
   * email qua body). */
  sendVerificationEmail(accessToken: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.sendVerificationEmail, {
      method: 'POST',
      accessToken,
    });
  },

  resendVerificationEmail(accessToken: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.resendVerificationEmail, {
      method: 'POST',
      accessToken,
    });
  },

  /** Public — token tự chứng minh danh tính (giống `resetPassword`), không cần accessToken. */
  verifyEmail(token: string) {
    return request<{ message: string }>(AUTH_ENDPOINTS.verifyEmail, {
      query: { token },
    });
  },
};
