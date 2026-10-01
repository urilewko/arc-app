"use client";
import { useEffect, useState, useCallback } from "react";

export interface TodoistSection {
  id: string;
  name: string;
}

let cache: TodoistSection[] | null = null;
let inflight: Promise<TodoistSection[]> | null = null;

async function fetchSections(): Promise<TodoistSection[]> {
  const res = await fetch("/api/todoist");
  const data = await res.json();
  return (data?.sections || []) as TodoistSection[];
}

/** Sections come from Todoist only — the app never creates or renames them. */
export function useTodoistSections() {
  const [sections, setSections] = useState<TodoistSection[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  const load = useCallback((force = false) => {
    if (!force && cache) { setSections(cache); setLoading(false); return; }
    if (!inflight || force) inflight = fetchSections();
    setLoading(true);
    inflight.then((s) => { cache = s; setSections(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { sections, loading, refresh: () => load(true) };
}
