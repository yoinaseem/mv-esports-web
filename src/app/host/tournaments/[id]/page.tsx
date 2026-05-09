"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  PauseCircleIcon,
  PlayCircleIcon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { listGames } from "@/lib/api/games";
import { listStages } from "@/lib/api/stages";
import {
  closeTournamentRegistration,
  getTournament,
  openTournamentRegistration,
  seedAndBuildTournament,
} from "@/lib/api/tournaments";
import type { Game } from "@/types/games";
import type { Stage } from "@/types/stages";
import {
  isTerminal,
  type Tournament,
  type TournamentStatus,
} from "@/types/tournaments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CancelTournamentDialog } from "@/components/tournaments/CancelTournamentDialog";

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft_pending_review: "Pending review",
  draft: "Draft",
  registration_open: "Registration open",
  registration_closed: "Registration closed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single elimination",
  double_elim: "Double elimination",
  round_robin: "Round robin",
  swiss: "Swiss",
};

function statusBadgeVariant(status: TournamentStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "draft_pending_review") return "default";
  if (status === "cancelled") return "destructive";
  if (status === "draft") return "secondary";
  return "outline";
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const datetimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return datetimeFormatter.format(new Date(iso));
}

export default function HostTournamentBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tournamentId = Number(id);

  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refetchKey, setRefetchKey] = useState(0);
  const [loading, startLoadTransition] = useTransition();
  const [actionPending, startActionTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startLoadTransition(async () => {
      try {
        const fetchedTournament = await getTournament(tournamentId);
        if (cancelled) return;
        setTournament(fetchedTournament);

        const [stageList, games] = await Promise.all([
          listStages(tournamentId),
          listGames({ includeInactive: true }),
        ]);
        if (cancelled) return;
        setStages(stageList.slice().sort((a, b) => a.sort_order - b.sort_order));
        setGame(games.find((g) => g.id === fetchedTournament.game_id) ?? null);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Couldn't load tournament.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tournamentId, refetchKey]);

  const refetch = () => setRefetchKey((k) => k + 1);

  const runAction = (
    fn: (id: number) => Promise<Tournament>,
    successLabel: string,
  ) => {
    if (!tournament) return;
    startActionTransition(async () => {
      try {
        const updated = await fn(tournament.id);
        setTournament(updated);
        toast.success(successLabel);
      } catch (error) {
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : error instanceof Error
              ? error.message
              : "Action failed.";
        toast.error(message);
      }
    });
  };

  const handleCancelled = (cancelled: Tournament) => {
    setTournament(cancelled);
    toast.success(`Cancelled ${cancelled.name}`);
  };

  if (loading && !tournament) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (loadError && !tournament) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-4 px-6 py-12">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button onClick={refetch}>Retry</Button>
      </section>
    );
  }

  if (!tournament) return null;

  const status = tournament.status;
  const canOpenRegistration = status === "draft" && stages.length > 0;
  const canCloseRegistration = status === "registration_open";
  const canSeedAndBuild = status === "registration_closed";
  const canCancel = !isTerminal(status);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Tournament builder</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{tournament.name}</h1>
          <Badge variant={statusBadgeVariant(status)}>{STATUS_LABELS[status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {game?.name ?? `Game #${tournament.game_id}`} · {tournament.participant_type === "team" ? "Teams" : "Solo players"} · slug{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{tournament.slug}</code>
        </p>
      </header>

      {status === "draft_pending_review" ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="text-sm">
            This tournament is awaiting manager review. You can&apos;t edit configuration or open
            registration until a manager approves it.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tournament window</p>
            <p className="text-sm">
              {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Registration window</p>
            <p className="text-sm">
              {formatDateTime(tournament.registration_opens_at)} → {formatDateTime(tournament.registration_closes_at)}
            </p>
          </div>
          {tournament.max_participants ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Max participants</p>
              <p className="text-sm">{tournament.max_participants}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Registration type</p>
            <p className="text-sm capitalize">{tournament.registration_type.replace("_", " ")}</p>
          </div>
        </CardContent>
      </Card>

      {tournament.description ? (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{tournament.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Stages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stages yet. Add one before opening registration.
            </p>
          ) : (
            stages.map((stage) => (
              <div
                key={stage.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/20 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {FORMAT_LABELS[stage.format] ?? stage.format} · sort {stage.sort_order}
                  </p>
                </div>
                <Badge variant={stage.status === "in_progress" ? "outline" : "secondary"}>
                  {stage.status.replace("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "in_progress" || status === "completed" ? (
            <p className="text-sm text-muted-foreground">
              Bracket viewer arrives in the next commit. The bracket is generated and ready in the database.
            </p>
          ) : status === "registration_closed" ? (
            <p className="text-sm text-muted-foreground">
              Registrations are closed. Hit <span className="font-medium text-foreground">Seed &amp; build</span> below to generate the bracket.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              The bracket appears once registration closes and you build it. Until then, you&apos;ll see structure here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canOpenRegistration ? (
            <Button
              onClick={() => runAction(openTournamentRegistration, "Registration opened")}
              disabled={actionPending}
            >
              <HugeiconsIcon icon={PlayCircleIcon} strokeWidth={2} />
              Open registration
            </Button>
          ) : null}
          {canCloseRegistration ? (
            <Button
              variant="outline"
              onClick={() => runAction(closeTournamentRegistration, "Registration closed")}
              disabled={actionPending}
            >
              <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} />
              Close registration
            </Button>
          ) : null}
          {canSeedAndBuild ? (
            <Button
              onClick={() => runAction(seedAndBuildTournament, "Bracket built — tournament is now in progress")}
              disabled={actionPending}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
              Seed &amp; build bracket
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={actionPending}
            >
              <HugeiconsIcon icon={PauseCircleIcon} strokeWidth={2} />
              Cancel tournament
            </Button>
          ) : null}
          {!canOpenRegistration && !canCloseRegistration && !canSeedAndBuild && !canCancel ? (
            <p className="text-sm text-muted-foreground">No actions available in this state.</p>
          ) : null}
        </CardContent>
      </Card>

      <CancelTournamentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        tournament={tournament}
        onCancelled={handleCancelled}
      />
    </section>
  );
}
