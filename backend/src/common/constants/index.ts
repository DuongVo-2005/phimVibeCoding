export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum FilmCategory {
  SINGLE = 'single',
  SERIES = 'series',
}

export enum FilmStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

export enum FavoriteTargetType {
  FILM = 'film',
  ACTOR = 'actor',
}

export enum FilmReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
}

export enum CrawlerRunStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSION_KEY = 'permission';
