export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface PaginationMeta {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
