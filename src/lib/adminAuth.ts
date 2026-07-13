/**
 * Lightweight client-side admin auth for the PYDAH Virtual Tour.
 *
 * This is intentionally simple — a shared admin credential kept on the client
 * plus a session token in localStorage. It gates the admin UI from casual
 * visitors. Swap for a real backend (JWT + server verification) when the
 * project graduates to production auth.
 *
 * Default credentials:  admin / pydah@admin
 * Override via env vars: VITE_ADMIN_USERNAME, VITE_ADMIN_PASSWORD
 */

const TOKEN_KEY = "pydah_admin_token";
const REMEMBER_KEY = "pydah_admin_remember";

const ADMIN_USER =
  (import.meta.env.VITE_ADMIN_USERNAME as string | undefined) ?? "admin";
const ADMIN_PASS =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "pydah@admin";

function storage(remember: boolean): Storage | null {
  if (typeof window === "undefined") return null;
  return remember ? window.localStorage : window.sessionStorage;
}

export function login(
  username: string,
  password: string,
  remember: boolean,
): { ok: boolean; error?: string } {
  if (username.trim().toLowerCase() !== ADMIN_USER.toLowerCase()) {
    return { ok: false, error: "Invalid username or password" };
  }
  if (password !== ADMIN_PASS) {
    return { ok: false, error: "Invalid username or password" };
  }
  const token = `pydah.${btoa(`${username}:${Date.now()}`)}.${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const store = storage(remember);
  if (!store) return { ok: false, error: "Storage unavailable" };
  // Clear the other bucket so we don't have stale tokens.
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  store.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  return { ok: true };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.sessionStorage.getItem(TOKEN_KEY) ||
      window.localStorage.getItem(TOKEN_KEY),
  );
}
