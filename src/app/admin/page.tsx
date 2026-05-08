"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const greeting = user?.display_name?.trim() || user?.name?.trim() || user?.email || "there";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome, {greeting}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage games, hosts, tournaments, and users from here. More sections will land alongside their backend commits.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Games</CardTitle>
            <CardDescription>
              The catalog of titles tournaments can be hosted for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add, edit, and archive games. Hosted at <code>/admin/games</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
