/**
 * /admin-login — glassmorphism login form gating access to /admin.
 *
 * Uses lightweight client-side auth (see src/lib/adminAuth.ts). On success,
 * navigates to the admin dashboard (or to the `redirect` search param).
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Lock, LogIn, User, X } from "lucide-react";
import { isAuthenticated, login } from "@/lib/adminAuth";
import heroAsset from "@/assets/pydah-campus.jpg.asset.json";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/admin-login")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Admin Login — PYDAH Virtual Tour" },
      { name: "description", content: "Secure sign-in for PYDAH tour administrators." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin-login" });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: redirect ?? "/admin" });
    }
  }, [navigate, redirect]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = login(username, password, remember);
    if (!result.ok) {
      setError(result.error ?? "Login failed");
      setBusy(false);
      return;
    }
    navigate({ to: redirect ?? "/admin" });
  }

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroAsset.url})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-primary/60 to-black/80" aria-hidden />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center px-4 py-16">
        <form
          onSubmit={onSubmit}
          className="w-full rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl"
        >
          <div className="mb-6 flex flex-col items-center text-center text-white">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-lg backdrop-blur-md">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Admin Sign In</h1>
            <p className="mt-1 text-sm text-white/70">
              Restricted area — authorised administrators only.
            </p>
          </div>

          {/* Username */}
          <label className="block text-sm font-medium text-white/90">
            Username or Email
            <div className="mt-1.5 flex items-center rounded-xl border border-white/20 bg-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40">
              <User className="ml-3 h-4 w-4 text-white/60" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="admin"
              />
            </div>
          </label>

          {/* Password */}
          <label className="mt-4 block text-sm font-medium text-white/90">
            Password
            <div className="mt-1.5 flex items-center rounded-xl border border-white/20 bg-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40">
              <Lock className="ml-3 h-4 w-4 text-white/60" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mr-2 grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {/* Options */}
          <div className="mt-4 flex items-center justify-between text-xs text-white/80">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-white/10 accent-accent"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() =>
                alert(
                  "Contact the site administrator to reset your admin password.",
                )
              }
              className="text-white/70 underline-offset-4 hover:text-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <X className="h-4 w-4" /> Cancel
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-primary shadow-lg shadow-accent/30 transition hover:brightness-110 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" /> {busy ? "Signing in…" : "Login"}
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/50">
            Session is protected. Unauthorised access is prohibited.
          </p>
        </form>
      </div>
    </div>
  );
}
