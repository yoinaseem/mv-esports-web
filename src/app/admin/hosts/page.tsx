"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Delete01Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
} from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { listHosts, updateHost } from "@/lib/api/tournament-hosts";
import type { HostStatus, TournamentHost } from "@/types/tournament-hosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteHostDialog } from "@/components/hosts/DeleteHostDialog";

type FilterValue = "all" | HostStatus;

const STATUS_FILTERS: ReadonlyArray<{ value: FilterValue; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

function statusBadgeVariant(status: HostStatus): "default" | "outline" | "destructive" {
  if (status === "pending") return "default";
  if (status === "approved") return "outline";
  return "destructive";
}

function statusLabel(status: HostStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminHostsPage() {
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [hosts, setHosts] = useState<TournamentHost[]>([]);
  const [loadError, setLoadError] = useState("");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const [loading, startTransition] = useTransition();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingHost, setDeletingHost] = useState<TournamentHost | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const list = await listHosts(filter === "all" ? {} : { status: filter });
        if (cancelled) return;
        setHosts(list);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Couldn't load host applications.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filter, refetchKey]);

  const refetch = () => setRefetchKey((k) => k + 1);

  const handleSetStatus = async (host: TournamentHost, status: HostStatus) => {
    setPendingActionId(host.id);
    try {
      const updated = await updateHost(host.id, { status });
      // If the updated host no longer matches the active filter, drop it from
      // the local list to keep what's visible consistent with the chosen tab.
      setHosts((prev) =>
        filter === "all" || updated.status === filter
          ? prev.map((h) => (h.id === updated.id ? updated : h))
          : prev.filter((h) => h.id !== updated.id),
      );
      toast.success(
        status === "approved"
          ? `Approved ${updated.display_name}`
          : status === "suspended"
            ? `Suspended ${updated.display_name}`
            : `Updated ${updated.display_name}`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't update host status.";
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const openDelete = (host: TournamentHost) => {
    setDeletingHost(host);
    setDeleteOpen(true);
  };

  const handleDeleted = (deleted: TournamentHost) => {
    setHosts((prev) => prev.filter((h) => h.id !== deleted.id));
    toast.success(`Removed ${deleted.display_name}`);
  };

  const renderActions = (host: TournamentHost) => {
    const isPending = pendingActionId === host.id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${host.display_name}`}
            disabled={isPending}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {host.status !== "approved" ? (
            <DropdownMenuItem onSelect={() => void handleSetStatus(host, "approved")}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
              Approve
            </DropdownMenuItem>
          ) : null}
          {host.status !== "suspended" ? (
            <DropdownMenuItem onSelect={() => void handleSetStatus(host, "suspended")}>
              <HugeiconsIcon icon={PauseCircleIcon} strokeWidth={2} />
              Suspend
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => openDelete(host)}>
            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Operations</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tournament hosts</h1>
        <p className="text-sm text-muted-foreground">
          Review host applications. Approving grants the user the
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">tournaments.create</code>
          permission; suspending revokes it.
        </p>
      </header>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
        <TabsList>
          {STATUS_FILTERS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Host</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-32">Applied</TableHead>
              <TableHead className="w-32">Approved</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-destructive">
                  {loadError}{" "}
                  <button type="button" onClick={refetch} className="font-medium text-primary hover:underline">
                    Retry
                  </button>
                </TableCell>
              </TableRow>
            ) : hosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {filter === "pending"
                    ? "No pending applications."
                    : filter === "all"
                      ? "No host applications yet."
                      : `No ${filter} hosts.`}
                </TableCell>
              </TableRow>
            ) : (
              hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{host.display_name}</p>
                      {host.bio ? (
                        <p className="line-clamp-2 max-w-2xl text-xs text-muted-foreground">{host.bio}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(host.status)}>{statusLabel(host.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(host.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(host.approved_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">{renderActions(host)}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteHostDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        host={deletingHost}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
