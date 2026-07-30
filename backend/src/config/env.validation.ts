import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('*'),

  FRONTEND_URL: Joi.string().uri().optional(),

  MONGODB_URI: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
  JWT_EMAIL_VERIFICATION_SECRET: Joi.string().required(),
  JWT_EMAIL_VERIFICATION_EXPIRES: Joi.string().default('24h'),

  // ==== Mail (Phase 33 — Verify Email) ====
  // Tất cả optional: chưa cấu hình SMTP -> MailService tự rơi về log token dev-only (không throw
  // khi thiếu), khớp yêu cầu "giữ pattern dev hiện có, không phá vỡ khả năng chạy production".
  MAIL_HOST: Joi.string().optional().allow(''),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().optional().allow(''),
  MAIL_PASS: Joi.string().optional().allow(''),
  MAIL_FROM: Joi.string().optional(),

  OPHIM_API_BASE_URL: Joi.string().uri().required(),
  OPHIM_SYNC_LIST_CRON: Joi.string().default('*/30 * * * *'),
  OPHIM_SYNC_TYPES_CRON: Joi.string().default('0 3 * * *'),
  OPHIM_REQUEST_CONCURRENCY: Joi.number().default(3),
  OPHIM_SYNC_LIST_MAX_PAGES: Joi.number().default(3),
  OPHIM_CRAWLER_ENABLED: Joi.boolean().default(true),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .optional(),
  ADMIN_PASSWORD: Joi.string().min(8).optional(),
  ADMIN_NAME: Joi.string().default('Administrator'),

  REDIS_URL: Joi.string().optional().allow(''),
});
