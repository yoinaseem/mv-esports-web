"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">MV Esports</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Maldivian eSports tournaments — open brackets, public results.
          </h1>
        </header>

        <Card>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Checking session…</p>
            ) : isAuthenticated && user ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as</p>
                  <p className="text-lg font-medium">{user.display_name ?? user.name ?? user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.roles.length > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Roles</p>
                    <p className="text-sm">{user.roles.join(", ")}</p>
                  </div>
                ) : null}
                <Button variant="outline" onClick={() => void logout()}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;re browsing as a guest. Sign in to host or register for tournaments.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register">Create account</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
