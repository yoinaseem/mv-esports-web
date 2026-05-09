"use client";

import type { TournamentMatch } from "@/types/matches";
import type { Stage } from "@/types/stages";
import { SingleEliminationBracket } from "@/components/tournaments/bracket/SingleEliminationBracket";

type StageViewProps = {
  stage: Stage;
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
};

// Dispatcher: switches on stage.format to pick the right viewer. Single
// elimination ships now; DE and RR are placeholders until their own commits.
export function StageView({ stage, matches, onMatchClick }: StageViewProps) {
  if (stage.format === "single_elim") {
    return <SingleEliminationBracket matches={matches} onMatchClick={onMatchClick} />;
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

  if (stage.format === "round_robin") {
    return (
      <div className="rounded-md border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Round-robin standings table coming in the next commit.
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
