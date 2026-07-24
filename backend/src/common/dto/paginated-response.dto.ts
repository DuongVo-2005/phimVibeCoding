export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], totalItems: number, page: number, limit: number) {
    this.items = items;
    this.meta = {
      page,
      limit,
      totalItems,
      totalPages: limit > 0 ? Math.ceil(totalItems / limit) : 0,
    };
  }
}
