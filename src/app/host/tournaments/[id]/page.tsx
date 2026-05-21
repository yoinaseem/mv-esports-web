"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ChampionIcon,
  Edit01Icon,
  PauseCircleIcon,
  PlayCircleIcon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";

import { ApiError } from "@/lib/api-client";
import { listGames } from "@/lib/api/games";
import { listMatches } from "@/lib/api/matches";
import { listRegistrations } from "@/lib/api/registrations";
import { getSeedAndBuildPreview } from "@/lib/api/seed-and-build";
import { listStageQualifications } from "@/lib/api/stage-qualifications";
import { listStages } from "@/lib/api/stages";
import {
  closeTournamentRegistration,
  getTournament,
  openTournamentRegistration,
} from "@/lib/api/tournaments";
import type { Game } from "@/types/games";
import type { TournamentMatch } from "@/types/matches";
import type { TournamentRegistration } from "@/types/registrations";
import type { SeedAndBuildPreview as SeedAndBuildPreviewPayload } from "@/types/seed-preview";
import type { StageQualification } from "@/types/stage-qualifications";
import { formatLabel, type RoundRobinConfig, type Stage } from "@/types/stages";
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
import { DetailsSection } from "@/components/tournaments/builder/DetailsSection";
import { MatchScoreDialog } from "@/components/tournaments/builder/MatchScoreDialog";
import { RegistrationsSection } from "@/components/tournaments/builder/RegistrationsSection";
import { ScheduleSection } from "@/components/tournaments/builder/ScheduleSection";
import { SeedAndBuildConfirmDialog } from "@/components/tournaments/builder/SeedAndBuildConfirmDialog";
import { StageEditDialog } from "@/components/tournaments/builder/StageEditDialog";
import { StageView } from "@/components/tournaments/bracket/StageView";

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft_pending_review: "Pending review",
  draft: "Draft",
  registration_open: "Registration open",
  registration_closed: "Registration closed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function statusBadgeVariant(
  status: TournamentStatus,
): "default" | "secondary" | "outline" | "destructive" {
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
  const [matchesByStageId, setMatchesByStageId] = useState<
    Record<number, TournamentMatch[]>
  >({});
  // Rules live on the target stage; re-keyed by source for the RR
  // qualifying-row highlight.
  const [qualificationsBySourceStageId, setQualificationsBySourceStageId] =
    useState<Record<number, StageQualification[]>>({});
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    [],
  );
  const [game, setGame] = useState<Game | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refetchKey, setRefetchKey] = useState(0);
  const [loading, startLoadTransition] = useTransition();
  const [actionPending, startActionTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);

  // Seed-and-build preview: fetched on entering RegistrationClosed and again
  // whenever a bulk-seed PATCH succeeds. Cached at this level so the live
  // panel in RegistrationsSection and the seed-and-build confirmation dialog
  // share the same payload. Null until first fetch completes; setting to
  // null on stale (e.g. status leaves RegistrationClosed) triggers refetch.
  const [preview, setPreview] = useState<SeedAndBuildPreviewPayload | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirmBuildOpen, setConfirmBuildOpen] = useState(false);

  // Hold the open-match by id rather than a full snapshot — when
  // matchesByStageId refetches (e.g. after the MatchGameObserver
  // auto-completes the match), this id reads the live row and the dialog
  // re-renders with the updated status (so canEdit flips false and the
  // add-game form hides).
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const editingStage = useMemo<Stage | null>(() => {
    if (editingStageId == null) return null;
    return stages.find((s) => s.id === editingStageId) ?? null;
  }, [editingStageId, stages]);

  const [scoringMatchId, setScoringMatchId] = useState<number | null>(null);
  const scoringMatch = useMemo<TournamentMatch | null>(() => {
    if (scoringMatchId == null) return null;
    for (const list of Object.values(matchesByStageId)) {
      const found = list.find((m) => m.id === scoringMatchId);
      if (found) return found;
    }
    return null;
  }, [scoringMatchId, matchesByStageId]);

  // Resolve the open match's parent stage so we can read allow_draws and
  // pass it down. Only RR stages set the flag; SE/DE always evaluate to false.
  const scoringStageAllowsDraws = useMemo<boolean>(() => {
    if (!scoringMatch) return false;
    const stage = stages.find((s) => s.id === scoringMatch.stage_id);
    if (!stage || stage.format !== "round_robin") return false;
    return (stage.config as RoundRobinConfig)?.allow_draws === true;
  }, [scoringMatch, stages]);

  useEffect(() => {
    let cancelled = false;
    startLoadTransition(async () => {
      try {
        const fetchedTournament = await getTournament(tournamentId);
        if (cancelled) return;
        setTournament(fetchedTournament);

        const [stageList, games, registrationList] = await Promise.all([
          listStages(tournamentId),
          listGames({ includeInactive: true }),
          // Always pull registrations — even an empty list is meaningful so the
          // host sees the section in registration_open / registration_closed.
          listRegistrations(tournamentId),
        ]);
        if (cancelled) return;
        const sortedStages = stageList
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order);
        setStages(sortedStages);
        setGame(games.find((g) => g.id === fetchedTournament.game_id) ?? null);
        setRegistrations(registrationList);
        setLoadError("");

        // Matches arrive with eager-loaded participants. Qualifications
        // load in the same parallel batch — the RR view needs them.
        const stagesWithMatches = sortedStages.filter(
          (s) => s.status !== "pending",
        );
        const [matchResults, qualResults] = await Promise.all([
          stagesWithMatches.length > 0
            ? Promise.all(
                stagesWithMatches.map((s) =>
                  listMatches(tournamentId, s.id).then((matches) => ({
                    stageId: s.id,
                    matches,
                  })),
                ),
              )
            : Promise.resolve(
                [] as { stageId: number; matches: TournamentMatch[] }[],
              ),
          Promise.all(
            sortedStages.map((s) =>
              listStageQualifications(tournamentId, s.id).then((quals) => ({
                stageId: s.id,
                quals,
              })),
            ),
          ),
        ]);
        if (cancelled) return;

        const grouped: Record<number, TournamentMatch[]> = {};
        for (const r of matchResults) grouped[r.stageId] = r.matches;
        setMatchesByStageId(grouped);

        const bySource: Record<number, StageQualification[]> = {};
        for (const { quals } of qualResults) {
          for (const q of quals) {
            if (q.source_stage_id == null) continue;
            const list = bySource[q.source_stage_id] ?? [];
            list.push(q);
            bySource[q.source_stage_id] = list;
          }
        }
        setQualificationsBySourceStageId(bySource);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Couldn't load tournament.",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tournamentId, refetchKey]);

  const refetch = () => setRefetchKey((k) => k + 1);

  // Preview fetch — backend rejects in non-RegistrationClosed statuses, so
  // gate early. Dep is [tournament] (not .id/.status) so React Compiler's
  // inferred memo matches.
  const refreshPreview = useCallback(async () => {
    if (tournament?.status !== "registration_closed") return;
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const next = await getSeedAndBuildPreview(tournament.id);
      setPreview(next);
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't load preview.";
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  }, [tournament]);

  useEffect(() => {
    if (tournament?.status !== "registration_closed") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refreshPreview's leading setState trips the rule via call-graph analysis; status-reactive refetch is the right shape here.
    void refreshPreview();
  }, [tournament?.status, refreshPreview]);

  const runAction = (
    fn: (id: number) => Promise<Tournament>,
    successLabel: string,
    options: { refetchAfter?: boolean } = {},
  ) => {
    if (!tournament) return;
    startActionTransition(async () => {
      try {
        const updated = await fn(tournament.id);
        setTournament(updated);
        toast.success(successLabel);
        // Some actions (seed-and-build) generate side-effect data the page
        // depends on (matches, stage participants). Trigger a full refetch.
        if (options.refetchAfter) refetch();
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

  if (!tournament) {
    if (loadError) {
      return (
        <section className="mx-auto w-full max-w-5xl space-y-4 px-6 py-12">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button onClick={refetch}>Retry</Button>
        </section>
      );
    }
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  const status = tournament.status;
  const canOpenRegistration = status === "draft" && stages.length > 0;
  const canCloseRegistration = status === "registration_open";
  const canSeedAndBuild = status === "registration_closed";
  const canCancel = !isTerminal(status);
  const approvedRegistrationCount = registrations.filter(
    (r) => r.status === "approved",
  ).length;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Tournament builder
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {tournament.name}
          </h1>
          <Badge variant={statusBadgeVariant(status)}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {game?.name ?? `Game #${tournament.game_id}`} ·{" "}
          {tournament.participant_type === "team" ? "Teams" : "Solo players"} ·
          slug{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {tournament.slug}
          </code>
        </p>
      </header>

      {status === "draft_pending_review" ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="text-sm">
            This tournament is awaiting manager review. You can&apos;t edit
            configuration or open registration until a manager approves it.
          </CardContent>
        </Card>
      ) : null}

      {status === "completed" ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center gap-3 text-sm">
            <HugeiconsIcon
              icon={ChampionIcon}
              strokeWidth={1.75}
              className="size-6 text-primary"
            />
            <div>
              <p className="font-heading text-base font-semibold">
                Tournament complete
              </p>
              <p className="text-muted-foreground">
                The final match has decided. Bracket, registrations, and match
                results are locked for record-keeping.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {status === "cancelled" ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="text-sm">
            <p className="font-heading text-base font-semibold text-destructive">
              Tournament cancelled
            </p>
            <p className="mt-1 text-muted-foreground">
              This tournament was cancelled and is no longer active. Existing
              data is read-only.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScheduleSection
            tournament={tournament}
            onUpdated={setTournament}
            // Lock once the tournament has reached a terminal state. Mid-life
            // edits (e.g. extending registration during registration_open) are
            // intentionally allowed — backend enforces window rules on POST.
            editable={!isTerminal(status)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {tournament.max_participants ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Max participants
                </p>
                <p className="text-sm">{tournament.max_participants}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Registration type
              </p>
              <p className="text-sm capitalize">
                {tournament.registration_type.replace("_", " ")}
              </p>
            </div>
            {tournament.started_at ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Started
                </p>
                <p className="text-sm">
                  {formatDateTime(tournament.started_at)}
                </p>
              </div>
            ) : null}
            {tournament.completed_at ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Completed
                </p>
                <p className="text-sm">
                  {formatDateTime(tournament.completed_at)}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailsSection
            tournament={tournament}
            onUpdated={setTournament}
            // Same lock rule as Schedule: edits stay open until the tournament
            // reaches a terminal state. Backend's PATCH coupling on prize pool
            // is relaxed so partial updates round-trip cleanly.
            editable={!isTerminal(status)}
          />
        </CardContent>
      </Card>

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
                    {formatLabel(stage)} · sort {stage.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      stage.status === "in_progress" ? "outline" : "secondary"
                    }
                  >
                    {stage.status.replace("_", " ")}
                  </Badge>
                  {/* Edit pencil — only while the stage is still pending and the
                      tournament hasn't progressed past registration_closed.
                      Backend locks stage config once seed-and-build runs. */}
                  {stage.status === "pending" &&
                  (status === "draft" ||
                    status === "registration_open" ||
                    status === "registration_closed") ? (
                    <button
                      type="button"
                      aria-label={`Edit ${stage.name}`}
                      onClick={() => setEditingStageId(stage.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <HugeiconsIcon
                        icon={Edit01Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {status === "registration_open" ||
      status === "registration_closed" ||
      status === "in_progress" ||
      status === "completed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <RegistrationsSection
              tournamentId={tournament.id}
              tournamentStatus={status}
              registrations={registrations}
              onChange={setRegistrations}
              defaultTab={
                status === "registration_open"
                  ? "pending"
                  : status === "registration_closed"
                    ? "approved"
                    : "all"
              }
              // Lock the section once seeds are baked into matches (in_progress)
              // or the tournament has reached a terminal state — editing past
              // those points either desyncs the bracket or has no meaning.
              locked={status === "in_progress" || isTerminal(status)}
              preview={preview}
              previewLoading={previewLoading}
              previewError={previewError}
              onSeedsApplied={refreshPreview}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bracket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stages configured. Add at least one before opening
              registration.
            </p>
          ) : status === "registration_closed" ? (
            <p className="text-sm text-muted-foreground">
              Registrations are closed. Review the predicted bracket in the
              Registrations card above, then hit{" "}
              <span className="font-medium text-foreground">
                Seed &amp; build
              </span>{" "}
              below to generate it.
            </p>
          ) : status === "draft" ||
            status === "draft_pending_review" ||
            status === "registration_open" ? (
            <p className="text-sm text-muted-foreground">
              The bracket appears once registration closes and you build it.
            </p>
          ) : (
            stages.map((stage) => {
              const stageMatches = matchesByStageId[stage.id] ?? [];
              return (
                <div key={stage.id} className="space-y-2">
                  {stages.length > 1 ? (
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">{stage.name}</h3>
                      <Badge
                        variant={
                          stage.status === "completed" ? "outline" : "secondary"
                        }
                      >
                        {stage.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ) : null}
                  <StageView
                    stage={stage}
                    matches={stageMatches}
                    onMatchClick={(m) => setScoringMatchId(m.id)}
                    useSiteBracket
                    qualifyingRules={
                      qualificationsBySourceStageId[stage.id] ?? []
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {canOpenRegistration ||
      canCloseRegistration ||
      canSeedAndBuild ||
      canCancel ? (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {canOpenRegistration ? (
              <>
                {/* Backend enforces strict cap === max while in Draft and locks
                    the rule in one last time at open-registration; afterwards
                    the two decouple and only the approved-count guard remains.
                    Surface that as a small note so the host understands the
                    consequence of clicking before they click. */}
                <p className="w-full text-xs text-muted-foreground">
                  Opening registration locks the entry stage&apos;s capacity to
                  match max participants one last time. After this, you can
                  adjust capacity and max participants independently — only the
                  approved-registration count constrains shrinking.
                </p>
                <Button
                  onClick={() =>
                    runAction(openTournamentRegistration, "Registration opened")
                  }
                  disabled={actionPending}
                >
                  <HugeiconsIcon icon={PlayCircleIcon} strokeWidth={2} />
                  Open registration
                </Button>
              </>
            ) : null}
            {canCloseRegistration ? (
              <Button
                variant="outline"
                onClick={() =>
                  runAction(closeTournamentRegistration, "Registration closed")
                }
                disabled={actionPending}
              >
                <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} />
                Close registration
              </Button>
            ) : null}
            {canSeedAndBuild ? (
              <Button
                onClick={() => {
                  // Always refetch preview when opening — the cached one might
                  // be stale if approvals shifted since the section first loaded.
                  void refreshPreview();
                  setConfirmBuildOpen(true);
                }}
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
          </CardContent>
        </Card>
      ) : null}

      <CancelTournamentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        tournament={tournament}
        onCancelled={handleCancelled}
      />
      <StageEditDialog
        open={editingStage !== null}
        onOpenChange={(open) => {
          if (!open) setEditingStageId(null);
        }}
        tournament={tournament}
        stage={editingStage}
        approvedRegistrationCount={approvedRegistrationCount}
        onUpdated={(updated) => {
          setStages((prev) =>
            prev
              .map((s) => (s.id === updated.id ? updated : s))
              .sort((a, b) => a.sort_order - b.sort_order),
          );
        }}
      />
      <MatchScoreDialog
        open={scoringMatch !== null}
        onOpenChange={(open) => {
          if (!open) setScoringMatchId(null);
        }}
        match={scoringMatch}
        allowDraws={scoringStageAllowsDraws}
        // Backend's MatchGameObserver auto-completes the match when the
        // best-of threshold is hit and propagates the winner through
        // advancement. Refetch matches so the bracket reflects new scores
        // / winners / cascaded slot fills, and so the open dialog picks up
        // the live match status (canEdit flips false, form hides).
        onMatchUpdated={refetch}
      />
      <SeedAndBuildConfirmDialog
        open={confirmBuildOpen}
        onOpenChange={setConfirmBuildOpen}
        tournamentId={tournament.id}
        preview={preview}
        loadError={previewError}
        onBuilt={(updated) => {
          // Mirror the previous runAction({ refetchAfter: true }) side-effect —
          // seed-and-build creates matches + stage participants the page
          // depends on, and the tournament moves to InProgress.
          setTournament(updated);
          refetch();
        }}
      />
    </section>
  );
}
