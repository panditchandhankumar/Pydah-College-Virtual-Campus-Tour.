/**
 * /admin — auth-gated layout for the admin area.
 *
 * All routes under `/admin/*` render inside this layout's <Outlet />.
 * Unauthenticated visitors are redirected to /admin-login and returned
 * to the requested URL after they sign in.
 */
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — PYDAH Virtual Tour" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/admin-login", search: { redirect: pathname } });
      return;
    }
    setReady(true);
  }, [navigate, pathname]);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Checking credentials…</p>
      </div>
    );
  }
  return <Outlet />;
}
