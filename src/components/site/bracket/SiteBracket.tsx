"use client";

import { useMemo, useState } from "react";

import type { TournamentMatch } from "@/types/matches";
import { WinnersBracketSection } from "./WinnersBracketSection";
import { LosersBracketSection } from "./LosersBracketSection";
import { GrandFinalSection } from "./GrandFinalSection";
import { buildDropInLabels, buildWinnerAncestorMap } from "./helpers";

type SiteBracketProps = {
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
};

export function SiteBracket({ matches, onMatchClick }: SiteBracketProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<number | null>(null);

  const { winners, losers, grandFinal, dropInLabels, ancestorMap } =
    useMemo(() => {
      const winners: TournamentMatch[] = [];
      const losers: TournamentMatch[] = [];
      const grandFinal: TournamentMatch[] = [];
      for (const m of matches) {
        if (m.bracket_type === "losers") losers.push(m);
        else if (m.bracket_type === "grand_final") grandFinal.push(m);
        else winners.push(m);
      }
      return {
        winners,
        losers,
        grandFinal,
        dropInLabels: buildDropInLabels(matches),
        ancestorMap: buildWinnerAncestorMap(matches),
      };
    }, [matches]);

  // SE mode turns on 3rd-place detection; in DE every WB loser drops to LB
  // and would mis-tag.
  const isSingleElim = losers.length === 0 && grandFinal.length === 0;

  if (matches.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card/40 p-12 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          No matches yet for this stage.
        </p>
      </div>
    );
  }

  return (
    <div className="site-bracket">
      <WinnersBracketSection
        matches={winners}
        onMatchClick={onMatchClick}
        hoveredKey={hoveredKey}
        onParticipantHover={setHoveredKey}
        hoveredMatchId={hoveredMatchId}
        onMatchHover={setHoveredMatchId}
        ancestorMap={ancestorMap}
        labelPrefix={isSingleElim ? "" : "WB "}
        sectionLabel={isSingleElim ? null : "Upper bracket"}
        detectThirdPlace={isSingleElim}
      />
      <LosersBracketSection
        matches={losers}
        onMatchClick={onMatchClick}
        hoveredKey={hoveredKey}
        onParticipantHover={setHoveredKey}
        hoveredMatchId={hoveredMatchId}
        onMatchHover={setHoveredMatchId}
        ancestorMap={ancestorMap}
        dropInLabels={dropInLabels}
      />
      <GrandFinalSection
        matches={grandFinal}
        onMatchClick={onMatchClick}
        hoveredKey={hoveredKey}
        onParticipantHover={setHoveredKey}
        onMatchHover={setHoveredMatchId}
      />
    </div>
  );
}
