"use client";

import type { TournamentMatch } from "@/types/matches";
import type { Stage } from "@/types/stages";
import { RoundRobinStandings } from "@/components/tournaments/bracket/RoundRobinStandings";
import { SingleEliminationBracket } from "@/components/tournaments/bracket/SingleEliminationBracket";

type StageViewProps = {
  stage: Stage;
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  // Override the default bracket viewer height. Public detail pages want a
  // taller container; admin/host's denser layout sticks with the default.
  containerHeight?: number;
  // Visual scale — `large` bumps boxHeight + spacing so the bracket feels
  // premium on public detail pages. `default` keeps the admin density.
  size?: "default" | "large";
};

// Dispatcher: switches on stage.format to pick the right viewer. Single elim
// and round-robin ship now; double elim placeholder until its own commit.
export function StageView({
  stage,
  matches,
  onMatchClick,
  containerHeight,
  size,
}: StageViewProps) {
  if (stage.format === "single_elim") {
    return (
      <SingleEliminationBracket
        matches={matches}
        onMatchClick={onMatchClick}
        containerHeight={containerHeight}
        size={size}
      />
    );
  }

  if (stage.format === "round_robin") {
    return <RoundRobinStandings stage={stage} matches={matches} onMatchClick={onMatchClick} />;
  }

  if (stage.format === "double_elim") {
    return (
      <div className="rounded-md border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Double-elimination bracket viewer coming in the next commit.
        </p>
      </div>
    );
  }

  // Swiss is in the schema but the bracket builder rejects it (DESIGN §6).
  return (
    <div className="rounded-md border border-dashed border-border p-12 text-center">
      <p className="text-sm text-muted-foreground">
        Swiss format isn&apos;t supported in this version.
      </p>
    </div>
  );
}
