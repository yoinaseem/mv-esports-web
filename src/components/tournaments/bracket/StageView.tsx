"use client";

import type { TournamentMatch } from "@/types/matches";
import type { Stage } from "@/types/stages";
import type { StageQualification } from "@/types/stage-qualifications";
import { RoundRobinStandings } from "@/components/tournaments/bracket/RoundRobinStandings";
import { SingleEliminationBracket } from "@/components/tournaments/bracket/SingleEliminationBracket";
import { SiteBracket } from "@/components/site/bracket/SiteBracket";

type StageViewProps = {
  stage: Stage;
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  // Legacy props honoured only by the @g-loot SingleEliminationBracket
  // fallback; ignored by SiteBracket (which sizes via CSS).
  containerHeight?: number;
  size?: "default" | "large";
  // Routes single-elim / double-elim through the in-house SiteBracket.
  // Both callers pass true; the @g-loot fallback below is now dead code
  // pending dependency removal.
  useSiteBracket?: boolean;
  // RR-only — bracket formats encode advancement on each match.
  qualifyingRules?: ReadonlyArray<StageQualification>;
};

export function StageView({
  stage,
  matches,
  onMatchClick,
  containerHeight,
  size,
  useSiteBracket,
  qualifyingRules,
}: StageViewProps) {
  if (stage.format === "single_elim") {
    if (useSiteBracket) {
      return <SiteBracket matches={matches} onMatchClick={onMatchClick} />;
    }
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
    return (
      <RoundRobinStandings
        stage={stage}
        matches={matches}
        onMatchClick={onMatchClick}
        qualifyingRules={qualifyingRules}
      />
    );
  }

  if (stage.format === "double_elim") {
    if (useSiteBracket) {
      return <SiteBracket matches={matches} onMatchClick={onMatchClick} />;
    }
    return (
      <div className="rounded-md border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Double-elimination requires the in-house renderer (useSiteBracket).
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
