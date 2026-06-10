import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// camelCase ↔ snake_case helpers
type Rec = Record<string, unknown>;

export function toSnake(obj: Rec): Rec {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([A-Z])/g, "_$1").toLowerCase(),
      v,
    ])
  );
}

export function toCamel(obj: Rec): Rec {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      v,
    ])
  );
}

export function rowsToCamel(rows: Rec[]): Rec[] {
  return rows.map(toCamel);
}
