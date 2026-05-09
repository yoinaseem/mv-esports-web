"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

import type { TournamentMatch } from "@/types/matches";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STATUS_LABELS: Record<TournamentMatch["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  walkover: "Walkover",
  conditional: "Conditional",
  cancelled: "Cancelled",
};

const BRACKET_TYPE_LABELS: Record<string, string> = {
  winners: "Winners bracket",
  losers: "Losers bracket",
  grand_final: "Grand final",
  group: "Group stage",
};

function statusBadgeVariant(status: TournamentMatch["status"]): "default" | "outline" | "secondary" | "destructive" {
  if (status === "scheduled" || status === "in_progress") return "default";
  if (status === "completed" || status === "walkover") return "outline";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return dateTimeFormatter.format(new Date(iso));
}

type Props = {
  match: TournamentMatch;
};

// The trigger is a small button positioned on the divider between the two
// participant rows. Click opens a popover with match metadata. Public-safe:
// no host-only data leaked, just what's already on a publicly-readable match.
export function MatchInfoPopover({ match }: Props) {
  const bracketLabel = BRACKET_TYPE_LABELS[match.bracket_type] ?? match.bracket_type;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Match details"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:text-primary"
        >
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        className="w-72 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-semibold">
            {bracketLabel} · Round {match.bracket_round}
          </p>
          <Badge variant={statusBadgeVariant(match.status)}>
            {STATUS_LABELS[match.status]}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Best of</dt>
          <dd>{match.best_of}</dd>

          <dt className="text-muted-foreground">Score</dt>
          <dd className="tabular-nums">{match.score_a} – {match.score_b}</dd>

          <dt className="text-muted-foreground">Position</dt>
          <dd>#{match.bracket_position + 1}</dd>

          {match.group_number != null ? (
            <>
              <dt className="text-muted-foreground">Group</dt>
              <dd>{match.group_number}</dd>
            </>
          ) : null}

          <dt className="text-muted-foreground">Scheduled</dt>
          <dd>{formatDateTime(match.scheduled_at)}</dd>

          <dt className="text-muted-foreground">Completed</dt>
          <dd>{formatDateTime(match.completed_at)}</dd>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
