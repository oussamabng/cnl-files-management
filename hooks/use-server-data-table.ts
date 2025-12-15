"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import type {
  PaginatedApiResponse,
  ServerPaginationMeta,
} from "@/types/pagination";

type UseServerDataTableOptions<
  TData,
  TStats,
  TExtra extends Record<string, unknown>
> = {
  endpoint: string;
  enabled?: boolean;

  initialPageSize?: number;
  initialSorting?: SortingState;

  extraQuery?: TExtra;

  /**
   * Optional: customize query string building.
   * If not provided, defaults to: pageIndex, pageSize, sortBy, sortDir + extraQuery fields.
   */
  buildSearchParams?: (args: {
    pagination: PaginationState;
    sorting: SortingState;
    extraQuery: TExtra;
  }) => URLSearchParams;
};

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function useServerDataTable<
  TData,
  TStats = unknown,
  TExtra extends Record<string, unknown> = Record<string, never>
>(opts: UseServerDataTableOptions<TData, TStats, TExtra>) {
  const {
    endpoint,
    enabled = true,
    initialPageSize = 10,
    initialSorting = [],
    extraQuery = {} as TExtra,
    buildSearchParams,
  } = opts;

  const [data, setData] = useState<TData[]>([]);
  const [meta, setMeta] = useState<ServerPaginationMeta | null>(null);
  const [stats, setStats] = useState<TStats | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const [isFetching, setIsFetching] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const reloadKeyRef = useRef(0);
  const refetch = useCallback(() => {
    reloadKeyRef.current += 1;
    // trigger effect by updating state:
    setInternalReloadKey(reloadKeyRef.current);
  }, []);
  const [internalReloadKey, setInternalReloadKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const lastRequestIdRef = useRef(0);

  const effectiveBuildParams = useMemo(() => {
    if (buildSearchParams) return buildSearchParams;

    return ({
      pagination,
      sorting,
      extraQuery,
    }: {
      pagination: PaginationState;
      sorting: SortingState;
      extraQuery: TExtra;
    }) => {
      const params = new URLSearchParams();

      params.set("pageIndex", String(pagination.pageIndex));
      params.set("pageSize", String(pagination.pageSize));

      const s0 = sorting?.[0];
      if (s0?.id) {
        params.set("sortBy", s0.id);
        params.set("sortDir", s0.desc ? "desc" : "asc");
      }

      Object.entries(extraQuery ?? {}).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        params.set(k, String(v));
      });

      return params;
    };
  }, [buildSearchParams]);

  const fetchPage = useCallback(async () => {
    if (!enabled) return;

    const requestId = ++lastRequestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    setError(null);

    try {
      // sanitize pagination locally (avoid crazy values)
      const safePagination: PaginationState = {
        pageIndex: clampInt(pagination.pageIndex, 0, 1_000_000),
        pageSize: clampInt(pagination.pageSize, 1, 100),
      };

      const params = effectiveBuildParams({
        pagination: safePagination,
        sorting,
        extraQuery,
      });

      const url = `${endpoint}?${params.toString()}`;

      const res = await fetch(url, { signal: controller.signal });
      const json = (await res.json()) as PaginatedApiResponse<TData, TStats>;

      if (requestId !== lastRequestIdRef.current) return; // stale response
      if (!res.ok || !json.success) {
        setError(json.message || "Erreur lors du chargement.");
        setHasLoadedOnce(true);
        return;
      }

      setData(json.data ?? []);
      setMeta(json.meta);
      setStats((json.stats ?? null) as TStats | null);

      // If current pageIndex becomes out of range (e.g., deleted last item on last page),
      // auto-clamp and refetch.
      const pc = json.meta?.pageCount ?? 0;
      const nextMaxIndex = Math.max(0, pc - 1);

      if (safePagination.pageIndex > nextMaxIndex) {
        setPagination((p) => ({ ...p, pageIndex: nextMaxIndex }));
      }

      setHasLoadedOnce(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError("Erreur de connexion au serveur.");
      setHasLoadedOnce(true);
    } finally {
      if (requestId === lastRequestIdRef.current) {
        setIsFetching(false);
      }
    }
  }, [
    enabled,
    endpoint,
    pagination,
    sorting,
    extraQuery,
    effectiveBuildParams,
  ]);

  useEffect(() => {
    void fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    endpoint,
    pagination.pageIndex,
    pagination.pageSize,
    JSON.stringify(sorting),
    JSON.stringify(extraQuery),
    internalReloadKey,
  ]);

  const onPaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const onSortingChange = useCallback((updater: Updater<SortingState>) => {
    setSorting((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const isInitialLoading = enabled && !hasLoadedOnce && isFetching;

  return {
    data,
    meta,
    stats,
    error,

    pagination,
    sorting,

    isFetching,
    isInitialLoading,

    setPagination: onPaginationChange,
    setSorting: onSortingChange,

    refetch,
  };
}
