import type { PaginationState, SortingState } from "@tanstack/react-table";

export type ServerPaginationMeta = {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type PaginatedApiResponse<TData, TStats = unknown> = {
  success: boolean;
  data: TData[];
  meta: ServerPaginationMeta;
  stats?: TStats;
  message?: string;
  error?: string;
};

export type ServerTableQuery<TExtra extends Record<string, unknown> = {}> = {
  pagination: PaginationState;
  sorting: SortingState;
  extra: TExtra;
};
