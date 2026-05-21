"use client";

import type { TournamentMatch } from "@/types/matches";
import { SiteMatchCard } from "./SiteMatchCard";

type GrandFinalSectionProps = {
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  hoveredKey: string | null;
  onParticipantHover: (key: string | null) => void;
  // GF has no outgoing connectors but still propagates match hover so
  // the ancestor chain lights up upstream.
  onMatchHover: (matchId: number | null) => void;
};

export function GrandFinalSection({
  matches,
  onMatchClick,
  hoveredKey,
  onParticipantHover,
  onMatchHover,
}: GrandFinalSectionProps) {
  if (matches.length === 0) return null;

  const sorted = [...matches].sort(
    (a, b) => a.bracket_position - b.bracket_position,
  );

  // Hide the bracket-reset match until it leaves "conditional" status.
  const visible = sorted.filter(
    (m, idx) => idx === 0 || m.status !== "conditional",
  );

  if (visible.length === 0) return null;

  const hasReset = visible.length > 1;

  return (
    <div className="mt-12 border-t border-primary/30 pt-8">
      <div className="mb-6">
        <span className="kicker">Grand final</span>
      </div>
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
        {visible.map((match, idx) => (
          <div
            key={match.id}
            className="flex flex-col items-center gap-3"
            style={{ width: "var(--bracket-col-width)" }}
          >
            {hasReset ? (
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {idx === 0 ? "Final" : "Reset"}
              </span>
            ) : null}
            <SiteMatchCard
              match={match}
              onClick={onMatchClick}
              hoveredParticipantKey={hoveredKey}
              onParticipantHover={onParticipantHover}
              onMatchHover={onMatchHover}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
