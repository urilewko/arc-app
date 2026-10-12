/** Surfaces a failed Supabase write to the user instead of failing silently. */
export function reportDbError(table: string, action: string, message: string) {
  console.error(`${action} ${table}:`, message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("arc-db-error", { detail: { table, action, message } }));
  }
}
