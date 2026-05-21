"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { type MorphAlias, type TournamentMatch } from "@/types/matches";
import { participantDisplayName, type Participant } from "@/types/participants";
import type { RoundRobinConfig, Stage } from "@/types/stages";
import type {
  StageQualification,
  TopNConfig,
  TopNPerGroupConfig,
} from "@/types/stage-qualifications";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StandaloneMatchCard } from "@/components/tournaments/bracket/StandaloneMatchCard";

type ParticipantStats = {
  type: MorphAlias;
  id: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gameWins: number;
  gameLosses: number;
};

// 3 points per win, 1 per draw, 0 per loss — matches the backend's
// StandingsCalculator scoring scheme for RR stages.
function pointsFor(s: ParticipantStats): number {
  return 3 * s.wins + s.draws;
}

type GroupBucket = {
  groupNumber: number | null;
  matches: TournamentMatch[];
  standings: ParticipantStats[];
};

// Visual aid only — backend does authoritative selection on advance.
function participantKey(s: ParticipantStats): string {
  return `${s.type}-${s.id}`;
}

function compareStandings(x: ParticipantStats, y: ParticipantStats): number {
  const xPts = pointsFor(x);
  const yPts = pointsFor(y);
  if (xPts !== yPts) return yPts - xPts;
  const xDiff = x.gameWins - x.gameLosses;
  const yDiff = y.gameWins - y.gameLosses;
  if (xDiff !== yDiff) return yDiff - xDiff;
  if (y.gameWins !== x.gameWins) return y.gameWins - x.gameWins;
  return x.name.localeCompare(y.name);
}

function buildQualifyingSet(
  rules: ReadonlyArray<StageQualification>,
  buckets: GroupBucket[],
): Set<string> {
  const qualified = new Set<string>();

  for (const rule of rules) {
    if (rule.rule_type === "all") {
      for (const bucket of buckets) {
        for (const s of bucket.standings) qualified.add(participantKey(s));
      }
    } else if (rule.rule_type === "top_n_per_group") {
      const n = (rule.rule_config as TopNPerGroupConfig).per_group;
      for (const bucket of buckets) {
        const take = Math.min(n, bucket.standings.length);
        for (let i = 0; i < take; i++) {
          qualified.add(participantKey(bucket.standings[i]));
        }
      }
    } else if (rule.rule_type === "top_n") {
      const n = (rule.rule_config as TopNConfig).n;
      const merged: ParticipantStats[] = [];
      for (const bucket of buckets) {
        for (const s of bucket.standings) merged.push(s);
      }
      merged.sort(compareStandings);
      const take = Math.min(n, merged.length);
      for (let i = 0; i < take; i++) qualified.add(participantKey(merged[i]));
    }
    // "manual" — backend selects explicitly; nothing to infer here.
  }

  return qualified;
}

function ruleCaption(rule: StageQualification): string | null {
  if (rule.rule_type === "top_n_per_group") {
    const n = (rule.rule_config as TopNPerGroupConfig).per_group;
    return n === 1
      ? "Group winner advances to the next stage"
      : `Top ${n} per group advance to the next stage`;
  }
  if (rule.rule_type === "top_n") {
    const n = (rule.rule_config as TopNConfig).n;
    return n === 1
      ? "Top 1 advances to the next stage"
      : `Top ${n} advance to the next stage`;
  }
  if (rule.rule_type === "all") {
    return "All participants advance to the next stage";
  }
  return null;
}

function isMatchComplete(status: TournamentMatch["status"]): boolean {
  return status === "completed" || status === "walkover";
}

function ensureStats(
  byKey: Map<string, ParticipantStats>,
  type: MorphAlias | null,
  id: number | null,
  participant: Participant | null | undefined,
): ParticipantStats | null {
  if (type == null || id == null) return null;
  const key = `${type}-${id}`;
  let stats = byKey.get(key);
  if (!stats) {
    stats = {
      type,
      id,
      name: participantDisplayName(participant ?? null),
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
    };
    byKey.set(key, stats);
  }
  return stats;
}

function bucketize(matches: ReadonlyArray<TournamentMatch>): GroupBucket[] {
  const groupMap = new Map<number | null, TournamentMatch[]>();
  for (const m of matches) {
    const key = m.group_number ?? null;
    const list = groupMap.get(key);
    if (list) list.push(m);
    else groupMap.set(key, [m]);
  }

  const buckets: GroupBucket[] = [];
  for (const [groupNumber, groupMatches] of groupMap) {
    const statsByKey = new Map<string, ParticipantStats>();

    for (const m of groupMatches) {
      const a = ensureStats(
        statsByKey,
        m.participant_a_type,
        m.participant_a_id,
        m.participant_a,
      );
      const b = ensureStats(
        statsByKey,
        m.participant_b_type,
        m.participant_b_id,
        m.participant_b,
      );
      if (!a || !b) continue;
      if (!isMatchComplete(m.status)) continue;

      a.played += 1;
      b.played += 1;
      a.gameWins += m.score_a;
      a.gameLosses += m.score_b;
      b.gameWins += m.score_b;
      b.gameLosses += m.score_a;

      // A drawn match (allow_draws=true on the stage) completes with a null
      // winner. Both sides get +1 draw and no win/loss.
      const isDraw = m.winner_participant_id == null;
      if (isDraw) {
        a.draws += 1;
        b.draws += 1;
      } else {
        const winnerIsA =
          m.winner_participant_id === a.id &&
          m.winner_participant_type === a.type;
        if (winnerIsA) {
          a.wins += 1;
          b.losses += 1;
        } else {
          b.wins += 1;
          a.losses += 1;
        }
      }
    }

    const standings = Array.from(statsByKey.values()).sort(compareStandings);

    buckets.push({
      groupNumber,
      matches: groupMatches.slice().sort((p, q) => {
        if (p.bracket_round !== q.bracket_round)
          return p.bracket_round - q.bracket_round;
        return p.bracket_position - q.bracket_position;
      }),
      standings,
    });
  }

  buckets.sort((p, q) => (p.groupNumber ?? 0) - (q.groupNumber ?? 0));
  return buckets;
}

type GroupBlockProps = {
  bucket: GroupBucket;
  showGroupLabel: boolean;
  // Total number of leg matches per pair (stage.config.legs, default 1).
  // Used to label round headers as "Leg L · Round R" when > 1.
  legs: number;
  // Per-leg round count derived once for the stage. group_size is uniform
  // across groups so this is the same per bucket.
  roundsPerLeg: number;
  qualifiedKeys: ReadonlySet<string>;
  onMatchClick?: (match: TournamentMatch) => void;
};

function GroupBlock({
  bucket,
  showGroupLabel,
  legs,
  roundsPerLeg,
  qualifiedKeys,
  onMatchClick,
}: GroupBlockProps) {
  const { groupNumber, matches, standings } = bucket;

  // Group matches by round for display.
  const roundMap = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    const list = roundMap.get(m.bracket_round);
    if (list) list.push(m);
    else roundMap.set(m.bracket_round, [m]);
  }
  const rounds = Array.from(roundMap.entries()).sort(([a], [b]) => a - b);

  // For multi-leg RR, translate the flat bracket_round into Leg L · Round R.
  // For single-leg, keep the simpler "Round N" header. roundsPerLeg falls
  // back to bracket_round itself when we can't compute (shouldn't happen at
  // render time since the generator emits all matches up front).
  const labelFor = (round: number): string => {
    if (legs <= 1 || roundsPerLeg <= 0) return `Round ${round}`;
    const leg = Math.ceil(round / roundsPerLeg);
    const within = ((round - 1) % roundsPerLeg) + 1;
    return `Leg ${leg} · Round ${within}`;
  };

  return (
    <div className="space-y-4">
      {showGroupLabel ? (
        <h3 className="font-heading text-base font-semibold">
          Group {groupNumber ?? "—"}
        </h3>
      ) : null}

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead className="w-14 text-right">Pts</TableHead>
              <TableHead className="w-12 text-right">P</TableHead>
              <TableHead className="w-12 text-right">W</TableHead>
              <TableHead className="w-12 text-right">D</TableHead>
              <TableHead className="w-12 text-right">L</TableHead>
              <TableHead className="w-16 text-right">+/–</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No matches yet.
                </TableCell>
              </TableRow>
            ) : (
              standings.map((s, index) => {
                const diff = s.gameWins - s.gameLosses;
                const isQualified = qualifiedKeys.has(participantKey(s));
                return (
                  <TableRow
                    key={`${s.type}-${s.id}`}
                    className={cn(
                      isQualified && "bg-primary/10 hover:bg-primary/15",
                    )}
                  >
                    <TableCell className="font-medium tabular-nums">
                      {isQualified ? (
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            className="size-3 text-primary"
                            aria-label="Advances to next stage"
                          />
                          {index + 1}
                        </span>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        isQualified && "text-primary",
                      )}
                    >
                      {s.name}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-primary">
                      {pointsFor(s)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {s.played}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.wins}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {s.draws}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {s.losses}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${diff > 0 ? "text-primary" : diff < 0 ? "text-muted-foreground" : ""}`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {rounds.length > 0 ? (
        <div className="space-y-3">
          {rounds.map(([round, roundMatches]) => (
            <div key={round} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {labelFor(round)}
              </p>
              <div className="flex flex-wrap gap-3">
                {roundMatches.map((match) => (
                  <StandaloneMatchCard
                    key={match.id}
                    match={match}
                    onClick={
                      onMatchClick ? () => onMatchClick(match) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  stage: Stage;
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  // Rules pulling FROM this stage (caller filters by source_stage_id).
  qualifyingRules?: ReadonlyArray<StageQualification>;
};

export function RoundRobinStandings({
  stage,
  matches,
  onMatchClick,
  qualifyingRules,
}: Props) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-border p-12">
        <p className="text-sm text-muted-foreground">
          No matches yet for this stage.
        </p>
      </div>
    );
  }

  const config = stage.config as RoundRobinConfig;
  const legs = Math.max(1, config.legs ?? 1);
  // Derived from data — avoids guessing whether odd group sizes use phantoms.
  const maxRound = matches.reduce(
    (acc, m) => Math.max(acc, m.bracket_round),
    0,
  );
  const roundsPerLeg =
    legs > 0 ? Math.max(1, Math.round(maxRound / legs)) : maxRound;

  const buckets = bucketize(matches);
  const showGroupLabel = buckets.length > 1;

  // Mid-tournament standings could still flip — only highlight when final.
  const showQualifyingHighlight =
    stage.status === "completed" && (qualifyingRules?.length ?? 0) > 0;
  const qualifiedKeys = showQualifyingHighlight
    ? buildQualifyingSet(qualifyingRules ?? [], buckets)
    : new Set<string>();
  const captionLines = showQualifyingHighlight
    ? (qualifyingRules ?? [])
        .map(ruleCaption)
        .filter((s): s is string => s !== null)
    : [];

  return (
    <div className="space-y-8">
      {buckets.map((bucket) => (
        <GroupBlock
          key={bucket.groupNumber ?? "ungrouped"}
          bucket={bucket}
          showGroupLabel={showGroupLabel}
          legs={legs}
          roundsPerLeg={roundsPerLeg}
          qualifiedKeys={qualifiedKeys}
          onMatchClick={onMatchClick}
        />
      ))}

      {captionLines.length > 0 ? (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {captionLines.map((line, idx) => (
            <p key={idx} className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3 text-primary"
                aria-hidden
              />
              <span>{line}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
