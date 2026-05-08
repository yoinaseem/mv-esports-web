"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ReadonlyArray<string>;
  loginPath?: string;
  unauthorizedPath?: string;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = "/login",
  unauthorizedPath = "/",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const hasRequiredRole =
    !allowedRoles || (user?.roles?.some((role) => allowedRoles.includes(role)) ?? false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(loginPath);
      return;
    }

    if (!hasRequiredRole) {
      router.replace(unauthorizedPath);
    }
  }, [isAuthenticated, loading, hasRequiredRole, router, loginPath, unauthorizedPath]);

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

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
