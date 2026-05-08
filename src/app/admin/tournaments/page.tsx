"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
} from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { listGames } from "@/lib/api/games";
import { listHosts } from "@/lib/api/tournament-hosts";
import {
  approveTournament,
  listTournaments,
  rejectTournament,
} from "@/lib/api/tournaments";
import type { Game } from "@/types/games";
import type { TournamentHost } from "@/types/tournament-hosts";
import {
  isTerminal,
  type Tournament,
  type TournamentStatus,
} from "@/types/tournaments";
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
import { CancelTournamentDialog } from "@/components/tournaments/CancelTournamentDialog";

type FilterValue = "pending_review" | "all";

const TABS: ReadonlyArray<{ value: FilterValue; label: string }> = [
  { value: "pending_review", label: "Pending review" },
  { value: "all", label: "All" },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const dateFormatterWithYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatWindow(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  if (sameYear) {
    return `${dateFormatter.format(startDate)} – ${dateFormatterWithYear.format(endDate)}`;
  }
  return `${dateFormatterWithYear.format(startDate)} – ${dateFormatterWithYear.format(endDate)}`;
}

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft_pending_review: "Pending review",
  draft: "Draft",
  registration_open: "Registration open",
  registration_closed: "Registration closed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function statusBadgeVariant(status: TournamentStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "draft_pending_review") return "default";
  if (status === "cancelled") return "destructive";
  if (status === "draft") return "secondary";
  return "outline";
}

export default function AdminTournamentsPage() {
  const [filter, setFilter] = useState<FilterValue>("pending_review");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [hosts, setHosts] = useState<TournamentHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingTournament, setCancellingTournament] = useState<Tournament | null>(null);

  const gameMap = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);
  const hostMap = useMemo(() => new Map(hosts.map((h) => [h.id, h])), [hosts]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [tournamentList, gameList, hostList] = await Promise.all([
        listTournaments({
          includeDrafts: true,
          status: filter === "pending_review" ? "draft_pending_review" : undefined,
        }),
        listGames({ includeInactive: true }),
        listHosts(),
      ]);
      setTournaments(tournamentList);
      setGames(gameList);
      setHosts(hostList);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load tournaments.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const reconcile = useCallback(
    (updated: Tournament) => {
      setTournaments((prev) => {
        // If the updated tournament no longer matches the active filter,
        // drop it from the visible list (mirrors the hosts queue UX).
        const stillMatches =
          filter === "all" ||
          (filter === "pending_review" && updated.status === "draft_pending_review");
        if (!stillMatches) return prev.filter((t) => t.id !== updated.id);
        return prev.map((t) => (t.id === updated.id ? updated : t));
      });
    },
    [filter],
  );

  const runAction = async (
    tournament: Tournament,
    fn: (id: number) => Promise<Tournament>,
    successLabel: string,
  ) => {
    setPendingActionId(tournament.id);
    try {
      const updated = await fn(tournament.id);
      reconcile(updated);
      toast.success(`${successLabel} ${tournament.name}`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Action failed.";
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const openCancel = (tournament: Tournament) => {
    setCancellingTournament(tournament);
    setCancelOpen(true);
  };

  const handleCancelled = (cancelled: Tournament) => {
    reconcile(cancelled);
    toast.success(`Cancelled ${cancelled.name}`);
  };

  const renderActions = (tournament: Tournament) => {
    const isPending = pendingActionId === tournament.id;
    const isPendingReview = tournament.status === "draft_pending_review";
    const canCancel = !isTerminal(tournament.status);
    const hasAnyAction = isPendingReview || canCancel;

    if (!hasAnyAction) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${tournament.name}`}
            disabled={isPending}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isPendingReview ? (
            <>
              <DropdownMenuItem
                onSelect={() => void runAction(tournament, approveTournament, "Approved")}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => void runAction(tournament, rejectTournament, "Rejected")}
              >
                <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
                Reject
              </DropdownMenuItem>
            </>
          ) : null}
          {canCancel ? (
            <>
              {isPendingReview ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem variant="destructive" onSelect={() => openCancel(tournament)}>
                <HugeiconsIcon icon={PauseCircleIcon} strokeWidth={2} />
                Cancel tournament
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Operations</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tournaments</h1>
        <p className="text-sm text-muted-foreground">
          Approve host applications, reject inappropriate drafts, or cancel a tournament that
          shouldn&apos;t proceed. Open/close registration is host-driven and lives in the host
          dashboard.
        </p>
      </header>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
        <TabsList>
          {TABS.map((option) => (
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
              <TableHead>Tournament</TableHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-48">Window</TableHead>
              <TableHead className="w-20">Type</TableHead>
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
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-destructive">
                  {loadError}{" "}
                  <button
                    type="button"
                    onClick={() => void fetchAll()}
                    className="font-medium text-primary hover:underline"
                  >
                    Retry
                  </button>
                </TableCell>
              </TableRow>
            ) : tournaments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {filter === "pending_review"
                    ? "Nothing to review. Host applications will appear here when submitted."
                    : "No tournaments yet."}
                </TableCell>
              </TableRow>
            ) : (
              tournaments.map((tournament) => {
                const game = gameMap.get(tournament.game_id);
                const host = tournament.host_id ? hostMap.get(tournament.host_id) : null;
                const subtitle = [game?.name ?? `Game #${tournament.game_id}`,
                  host
                    ? `Hosted by ${host.display_name}`
                    : tournament.host_id
                      ? `Host #${tournament.host_id}`
                      : "Manager-created",
                ].join(" · ");

                return (
                  <TableRow key={tournament.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(tournament.status)}>
                        {STATUS_LABELS[tournament.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWindow(tournament.start_date, tournament.end_date)}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {tournament.participant_type}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">{renderActions(tournament)}</div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CancelTournamentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        tournament={cancellingTournament}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
