"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">MV Esports</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Maldivian eSports tournaments — open brackets, public results.
          </h1>
        </header>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          {loading ? (
            <p className="text-sm text-zinc-400">Checking session…</p>
          ) : isAuthenticated && user ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">Signed in as</p>
                <p className="text-lg font-medium">{user.display_name ?? user.name ?? user.email}</p>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
              {user.roles.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Roles</p>
                  <p className="text-sm">{user.roles.join(", ")}</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-medium hover:bg-zinc-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                You&apos;re browsing as a guest. Sign in to host or register for tournaments.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-medium hover:bg-zinc-800"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
