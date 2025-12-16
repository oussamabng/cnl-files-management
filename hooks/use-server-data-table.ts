"use client";

import * as React from "react";
import type { SortingState } from "@tanstack/react-table";

type PaginationState = { pageIndex: number; pageSize: number };

type Meta = {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

type ServerResponse<TData, TStats> = {
  success?: boolean;
  data: TData[];
  meta?: Meta;
  stats?: TStats;
  message?: string;
  error?: string;
};

function buildQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      const cleaned = v.map(String).filter(Boolean);
      if (!cleaned.length) return;
      sp.set(k, cleaned.join(","));
      return;
    }
    const s = String(v);
    if (!s) return;
    sp.set(k, s);
  });

  return sp.toString();
}

export function useServerDataTable<TData, TStats = unknown>(opts: {
  endpoint: string;
  enabled?: boolean;
  initialPageSize?: number;
  initialSorting?: SortingState;
  query?: Record<string, unknown>;
}) {
  const enabled = opts.enabled ?? true;

  const [data, setData] = React.useState<TData[]>([]);
  const [meta, setMeta] = React.useState<Meta | undefined>(undefined);
  const [stats, setStats] = React.useState<TStats | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: opts.initialPageSize ?? 10,
  });

  const [sorting, setSorting] = React.useState<SortingState>(
    opts.initialSorting ?? []
  );

  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);

  const [nonce, bumpNonce] = React.useState(0);

  const refetch = React.useCallback(() => bumpNonce((n) => n + 1), []);

  const setPageIndex = React.useCallback((pageIndex: number) => {
    setPagination((p) => ({ ...p, pageIndex }));
  }, []);

  const setPageSize = React.useCallback((pageSize: number) => {
    setPagination((p) => ({ ...p, pageIndex: 0, pageSize }));
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      setIsInitialLoading(false);
      return;
    }

    const ac = new AbortController();

    const run = async () => {
      setIsFetching(true);
      setError(null);

      const primarySort = sorting?.[0];
      const query = buildQuery({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: primarySort?.id,
        sortDir: primarySort ? (primarySort.desc ? "desc" : "asc") : undefined,
        ...(opts.query ?? {}),
      });

      const url = query ? `${opts.endpoint}?${query}` : opts.endpoint;

      try {
        const res = await fetch(url, { signal: ac.signal });
        const json = (await res.json()) as ServerResponse<TData, TStats>;

        if (!res.ok || json.success === false) {
          const msg =
            json.message ||
            json.error ||
            "Erreur lors du chargement des données";
          setError(msg);
          setData([]);
          setMeta(undefined);
          setStats(undefined);
          return;
        }

        setData(json.data ?? []);
        setMeta(json.meta);
        setStats(json.stats);
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        setError("Erreur lors du chargement des données");
        setData([]);
        setMeta(undefined);
        setStats(undefined);
      } finally {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    };

    run();

    return () => ac.abort();
  }, [
    enabled,
    opts.endpoint,
    JSON.stringify(opts.query ?? {}),
    pagination.pageIndex,
    pagination.pageSize,
    JSON.stringify(sorting ?? []),
    nonce,
  ]);

  return {
    data,
    meta,
    stats,
    error,
    pagination,
    sorting,
    isInitialLoading,
    isFetching,
    setPagination,
    setSorting,
    setPageIndex,
    setPageSize,
    refetch,
  };
}
