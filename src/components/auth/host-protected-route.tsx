"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

type HostProtectedRouteProps = {
  children: React.ReactNode;
  loginPath?: string;
  unauthorizedPath?: string;
};

// Gates on the `tournaments.create` permission (granted to approved hosts via
// the host approval flow + always to system_manager / superadmin via roles).
// Distinct from ProtectedRoute which gates on roles directly.
export function HostProtectedRoute({
  children,
  loginPath = "/login",
  unauthorizedPath = "/",
}: HostProtectedRouteProps) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const router = useRouter();

  const allowed = hasPermission("tournaments.create");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(loginPath);
      return;
    }
    if (!allowed) {
      router.replace(unauthorizedPath);
    }
  }, [isAuthenticated, loading, allowed, router, loginPath, unauthorizedPath]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div role="status" aria-live="polite" className="flex items-center justify-center">
          <span className="sr-only">Loading…</span>
          <div className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !allowed) {
    return null;
  }

  return <>{children}</>;
}
