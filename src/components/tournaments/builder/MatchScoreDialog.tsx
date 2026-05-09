"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons";

import { ApiError, getValidationErrors } from "@/lib/api-client";
import {
  createMatchGame,
  deleteMatchGame,
  listMatchGames,
} from "@/lib/api/match-games";
import { updateMatch } from "@/lib/api/matches";
import {
  isMatchTerminal,
  type MatchGame,
  type MorphAlias,
  type TournamentMatch,
} from "@/types/matches";
import { participantDisplayName } from "@/types/participants";
import type { FieldErrors } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type MatchScoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: TournamentMatch | null;
  // Fired after any successful create / delete so the parent can refetch
  // matches — backend's MatchGameObserver may have auto-completed the match
  // and propagated the winner through advancement, so the whole bracket can
  // shift.
  onMatchUpdated: () => void;
};

type Side = "a" | "b";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function MatchScoreDialog({ open, onOpenChange, match, onMatchUpdated }: MatchScoreDialogProps) {
  const [games, setGames] = useState<MatchGame[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, startLoadTransition] = useTransition();

  // Add-game form state
  const [winnerSide, setWinnerSide] = useState<Side>("a");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [mapOrMode, setMapOrMode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, startSubmitting] = useTransition();

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [bestOfPending, startBestOfTransition] = useTransition();

  useEffect(() => {
    if (!open || !match) return;
    let cancelled = false;
    startLoadTransition(async () => {
      try {
        const list = await listMatchGames(match.id);
        if (cancelled) return;
        setGames(list.slice().sort((a, b) => a.game_number - b.game_number));
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Couldn't load match games.");
      }
    });
    // Reset form whenever the dialog re-opens.
    setWinnerSide("a");
    setScoreA("");
    setScoreB("");
    setMapOrMode("");
    setFieldErrors({});
    setFormError("");
    return () => {
      cancelled = true;
    };
  }, [open, match]);

  if (!match) return null;

  const aName = participantDisplayName(match.participant_a ?? null);
  const bName = participantDisplayName(match.participant_b ?? null);
  const seriesA = games.filter((g) =>
    g.winner_participant_type === match.participant_a_type &&
    g.winner_participant_id === match.participant_a_id,
  ).length;
  const seriesB = games.filter((g) =>
    g.winner_participant_type === match.participant_b_type &&
    g.winner_participant_id === match.participant_b_id,
  ).length;
  const winsToTake = Math.floor(match.best_of / 2) + 1;

  const matchTerminal = isMatchTerminal(match.status);
  const bothSlotsFilled =
    match.participant_a_type != null &&
    match.participant_a_id != null &&
    match.participant_b_type != null &&
    match.participant_b_id != null;
  const canEdit = !matchTerminal && bothSlotsFilled;
  // Backend locks best_of once any game exists or the match is terminal.
  const canEditBestOf = !matchTerminal && games.length === 0;

  const handleBestOfChange = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next === match.best_of) return;
    startBestOfTransition(async () => {
      try {
        await updateMatch(match.id, { best_of: next });
        toast.success(`Best of ${next}`);
        onMatchUpdated();
      } catch (error) {
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : error instanceof Error
              ? error.message
              : "Couldn't update best of.";
        toast.error(message);
      }
    });
  };

  const winnerLabel = (game: MatchGame): string => {
    if (game.winner_participant_id === match.participant_a_id &&
        game.winner_participant_type === match.participant_a_type) return aName;
    if (game.winner_participant_id === match.participant_b_id &&
        game.winner_participant_type === match.participant_b_type) return bName;
    return "—";
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    if (!bothSlotsFilled) {
      setFormError("Both participants must be set before recording a game.");
      return;
    }

    const winnerType =
      winnerSide === "a" ? match.participant_a_type : match.participant_b_type;
    const winnerId =
      winnerSide === "a" ? match.participant_a_id : match.participant_b_id;
    if (!winnerType || winnerId == null) {
      setFormError("Pick a winner before submitting.");
      return;
    }

    const nextGameNumber = (games[games.length - 1]?.game_number ?? 0) + 1;

    startSubmitting(async () => {
      try {
        const created = await createMatchGame(match.id, {
          game_number: nextGameNumber,
          winner_participant_type: winnerType as MorphAlias,
          winner_participant_id: winnerId,
          score_a: scoreA.trim() === "" ? null : Number(scoreA),
          score_b: scoreB.trim() === "" ? null : Number(scoreB),
          map_or_mode: mapOrMode.trim() || null,
        });
        setGames((prev) => [...prev, created].sort((a, b) => a.game_number - b.game_number));
        setScoreA("");
        setScoreB("");
        setMapOrMode("");
        toast.success(`Recorded game ${nextGameNumber}`);
        // Backend may have auto-completed the match — let the parent refetch.
        onMatchUpdated();
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          const validationErrors = getValidationErrors(error);
          setFieldErrors(validationErrors);
          if (Object.keys(validationErrors).length === 0) {
            setFormError("Please review your input and try again.");
          }
          return;
        }
        if (error instanceof Error && error.message.trim()) {
          setFormError(error.message);
          return;
        }
        setFormError("Couldn't record the game. Try again.");
      }
    });
  };

  const handleDelete = async (game: MatchGame) => {
    setPendingDeleteId(game.id);
    try {
      await deleteMatchGame(game.id);
      setGames((prev) => prev.filter((g) => g.id !== game.id));
      toast.success(`Removed game ${game.game_number}`);
      onMatchUpdated();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't remove game.";
      toast.error(message);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const renderFieldErrors = (key: string) =>
    fieldErrors[key]?.map((message) => (
      <p key={message} className="text-sm text-destructive">{message}</p>
    ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Record game results — {aName} vs {bName}
          </DialogTitle>
          <DialogDescription>
            First to {winsToTake} wins. The bracket advances automatically when
            one side hits the threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-4 py-3">
          <div>
            <Label htmlFor="best-of" className="text-xs uppercase tracking-widest text-muted-foreground">
              Series length
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {canEditBestOf
                ? "Set this before recording any games — locks once games are reported."
                : games.length > 0
                  ? "Locked because games have been recorded."
                  : "Locked because the match is finished."}
            </p>
          </div>
          <Select
            value={String(match.best_of)}
            onValueChange={handleBestOfChange}
            disabled={!canEditBestOf || bestOfPending}
          >
            <SelectTrigger id="best-of" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 3, 5, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Best of {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Series score</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            <span className={seriesA > seriesB ? "text-primary" : ""}>{aName} {seriesA}</span>
            <span className="mx-2 text-muted-foreground">—</span>
            <span className={seriesB > seriesA ? "text-primary" : ""}>{seriesB} {bName}</span>
          </p>
          {matchTerminal ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Match is {match.status.replace("_", " ")}. Game records below are read-only.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Games
          </p>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : games.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              No games recorded yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      G{pad(game.game_number)}
                    </Badge>
                    <div>
                      <p>
                        <span className="font-medium">{winnerLabel(game)}</span>
                        <span className="ml-2 tabular-nums text-muted-foreground">
                          {game.score_a ?? "—"} – {game.score_b ?? "—"}
                        </span>
                      </p>
                      {game.map_or_mode ? (
                        <p className="text-xs text-muted-foreground">{game.map_or_mode}</p>
                      ) : null}
                    </div>
                  </div>
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove game ${game.game_number}`}
                      disabled={pendingDeleteId === game.id}
                      onClick={() => void handleDelete(game)}
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {canEdit ? (
          <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Add game {(games[games.length - 1]?.game_number ?? 0) + 1}
            </p>

            <div className="space-y-2">
              <Label>Winner</Label>
              <RadioGroup
                value={winnerSide}
                onValueChange={(v) => setWinnerSide(v as Side)}
                className="grid grid-cols-2 gap-3"
              >
                {[{ side: "a" as const, label: aName }, { side: "b" as const, label: bName }].map((opt) => (
                  <Label
                    key={opt.side}
                    htmlFor={`winner-${opt.side}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                  >
                    <RadioGroupItem id={`winner-${opt.side}`} value={opt.side} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
              {renderFieldErrors("winner_participant_id")}
              {renderFieldErrors("winner_participant_type")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="score-a">{aName} score</Label>
                <Input
                  id="score-a"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  aria-invalid={fieldErrors.score_a?.length ? true : undefined}
                />
                {renderFieldErrors("score_a")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="score-b">{bName} score</Label>
                <Input
                  id="score-b"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  aria-invalid={fieldErrors.score_b?.length ? true : undefined}
                />
                {renderFieldErrors("score_b")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="map">Map / mode <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="map"
                type="text"
                placeholder="Bind, Mannfield, etc."
                value={mapOrMode}
                onChange={(e) => setMapOrMode(e.target.value)}
                aria-invalid={fieldErrors.map_or_mode?.length ? true : undefined}
              />
              {renderFieldErrors("map_or_mode")}
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                {submitting ? "Recording…" : "Record game"}
              </Button>
            </div>
          </form>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
