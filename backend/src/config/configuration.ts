export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
}

export interface MongoConfig {
  uri: string;
}

export interface JwtConfig {
  accessSecret: string;
  accessExpires: string;
  refreshSecret: string;
  refreshExpires: string;
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
  } as AppConfig,
  mongo: {
    uri: process.env.MONGODB_URI,
  } as MongoConfig,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  } as JwtConfig,
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
