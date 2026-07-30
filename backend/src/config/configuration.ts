export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  /** Phase 31 (Upload Module): gốc URL công khai dùng để dựng `UploadResponseDto.url` tuyệt đối
   * (file lưu local disk, serve qua static middleware ngoài `apiPrefix` — xem `main.ts`). */
  publicBaseUrl: string;
  /** Phase 33 (Verify Email): gốc URL frontend dùng để dựng link xác thực email gửi trong mail
   * (`${frontendUrl}/xac-thuc-email?token=...`) — KHÁC `corsOrigin` (có thể là `*` hoặc nhiều origin
   * phân tách bằng dấu phẩy, không dùng được để dựng 1 link duy nhất). */
  frontendUrl: string;
}

export interface MongoConfig {
  uri: string;
}

export interface JwtConfig {
  accessSecret: string;
  accessExpires: string;
  refreshSecret: string;
  refreshExpires: string;
  /** Phase 33 (Verify Email): secret RIÊNG cho token xác thực email — không dùng chung
   * `accessSecret`/`refreshSecret` (mỗi loại token có secret riêng, cùng nguyên tắc đã áp dụng cho
   * access/refresh — tránh 1 token loại này giả mạo được loại khác nếu payload trùng shape). */
  emailVerificationSecret: string;
  emailVerificationExpires: string;
}

export interface MailConfig {
  host: string | undefined;
  port: number;
  secure: boolean;
  user: string | undefined;
  pass: string | undefined;
  from: string;
}

export interface OphimConfig {
  baseUrl: string;
  syncListCron: string;
  syncTypesCron: string;
  requestConcurrency: number;
  syncListMaxPages: number;
  enabled: boolean;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface AdminConfig {
  email: string;
  password: string;
  name: string;
}

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? '3000'}`,
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  } as AppConfig,
  mongo: {
    uri: process.env.MONGODB_URI,
  } as MongoConfig,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
    emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET,
    emailVerificationExpires: process.env.JWT_EMAIL_VERIFICATION_EXPIRES ?? '24h',
  } as JwtConfig,
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: (process.env.MAIL_SECURE ?? 'false') === 'true',
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM ?? '"RoPhim" <no-reply@rophim.local>',
  } as MailConfig,
  ophim: {
    baseUrl: process.env.OPHIM_API_BASE_URL,
    syncListCron: process.env.OPHIM_SYNC_LIST_CRON ?? '*/30 * * * *',
    syncTypesCron: process.env.OPHIM_SYNC_TYPES_CRON ?? '0 3 * * *',
    requestConcurrency: parseInt(process.env.OPHIM_REQUEST_CONCURRENCY ?? '3', 10),
    syncListMaxPages: parseInt(process.env.OPHIM_SYNC_LIST_MAX_PAGES ?? '3', 10),
    enabled: (process.env.OPHIM_CRAWLER_ENABLED ?? 'true') === 'true',
  } as OphimConfig,
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  } as ThrottleConfig,
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME ?? 'Administrator',
  } as AdminConfig,
});
