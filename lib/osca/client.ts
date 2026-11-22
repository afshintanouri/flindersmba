/**
 * Client-side loading of the official OSCA dataset (public/data/osca/).
 *
 * Nothing here is bundled: files are fetched lazily, once per session, and
 * cached in memory. A failed fetch is not cached, so a retry is possible.
 *   - occupations-index.json      when Career Explorer search or an official profile opens
 *   - occupations-details/{n}.json only for the major group a profile needs
 *   - groups.json                 only for an official occupation profile (hierarchy)
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import type { OscaGroup, OscaOccupationDetail, OscaOccupationIndexEntry } from "./types";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/osca`;

const cache = new Map<string, Promise<unknown>>();

function load<T>(file: string, pick: (json: unknown) => T): Promise<T> {
  let p = cache.get(file) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${BASE}/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
        return r.json();
      })
      .then(pick);
    cache.set(file, p);
    p.catch(() => cache.delete(file));
  }
  return p;
}

export const loadOscaIndex = () =>
  load("occupations-index.json", (j) => (j as { occupations: OscaOccupationIndexEntry[] }).occupations);

export const loadOscaDetails = (majorGroupCode: string) =>
  load(`occupations-details/${majorGroupCode}.json`, (j) => (j as { occupations: Record<string, OscaOccupationDetail> }).occupations);

export const loadOscaGroups = () => load("groups.json", (j) => (j as { groups: OscaGroup[] }).groups);

export type Loadable<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error"; retry: () => void };

/** React hook around a lazy loader. `key` null = do not load. */
export function useLoad<T>(key: string | null, loader: () => Promise<T>): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    if (key === null) return;
    let live = true;
    setState({ status: "loading" });
    loader().then(
      (data) => live && setState({ status: "ready", data }),
      () => live && setState({ status: "error", retry }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return state;
}

export const useOscaIndex = (enabled = true) => useLoad(enabled ? "index" : null, loadOscaIndex);

export const useOscaDetail = (code: string | undefined, majorGroupCode: string | undefined) => {
  const s = useLoad(code && majorGroupCode ? `detail:${majorGroupCode}` : null, () => loadOscaDetails(majorGroupCode!));
  if (s.status !== "ready") return s;
  const detail = code ? s.data[code] : undefined;
  return detail ? ({ status: "ready", data: detail } as const) : ({ status: "error", retry: () => undefined } as Loadable<OscaOccupationDetail>);
};
