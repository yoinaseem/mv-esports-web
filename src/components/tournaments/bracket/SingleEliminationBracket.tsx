"use client";

import { useEffect, useRef, useState } from "react";
import {
  SingleEliminationBracket as LibSingleEliminationBracket,
  SVGViewer,
  type MatchType,
} from "@g-loot/react-tournament-brackets";

import type { TournamentMatch } from "@/types/matches";
import { MaiaMatch } from "@/components/tournaments/bracket/MaiaMatch";
import { StandaloneMatchCard } from "@/components/tournaments/bracket/StandaloneMatchCard";
import { bracketTheme } from "@/components/tournaments/bracket/bracketTheme";
import { transformMatchForLib } from "@/components/tournaments/bracket/transform";

type BracketSize = "default" | "large";

type Props = {
  matches: ReadonlyArray<TournamentMatch>;
  onMatchClick?: (match: TournamentMatch) => void;
  containerHeight?: number;
  // Visual scale of the bracket. `default` is the admin/host layout that
  // fits inside denser surfaces; `large` is for the public detail page where
  // we have more screen real estate and want the bracket to feel premium.
  size?: BracketSize;
};

const OPTIONS_BY_SIZE: Record<
  BracketSize,
  { spaceBetweenColumns: number; spaceBetweenRows: number; boxHeight: number }
> = {
  default: { spaceBetweenColumns: 60, spaceBetweenRows: 24, boxHeight: 72 },
  large: { spaceBetweenColumns: 100, spaceBetweenRows: 32, boxHeight: 100 },
};

export function SingleEliminationBracket({
  matches,
  onMatchClick,
  containerHeight = 560,
  size = "default",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.max(320, Math.floor(entry.contentRect.width)));
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // The 3rd-place match (when present) is the target of a semifinal's
  // loser_advances_to_match_id. The bracket library walks nextMatchId from a
  // single root (the final) and never reaches it, so we identify and render
  // it ourselves below the bracket.
  const thirdPlaceTargetIds = new Set<number>();
  for (const m of matches) {
    if (m.loser_advances_to_match_id != null) {
      thirdPlaceTargetIds.add(m.loser_advances_to_match_id);
    }
  }
  const thirdPlaceMatch = matches.find((m) => thirdPlaceTargetIds.has(m.id)) ?? null;
  const mainBracketMatches = thirdPlaceMatch
    ? matches.filter((m) => m.id !== thirdPlaceMatch.id)
    : matches;

  const libMatches = mainBracketMatches.map(transformMatchForLib) as unknown as MatchType[];

  if (libMatches.length === 0) {
    return (
      <div
        ref={wrapperRef}
        className="flex items-center justify-center rounded-md border border-dashed border-border p-12"
        style={{ minHeight: containerHeight }}
      >
        <p className="text-sm text-muted-foreground">No matches yet for this stage.</p>
      </div>
    );
  }

  const matchById = new Map(mainBracketMatches.map((m) => [m.id, m]));

  return (
    <div ref={wrapperRef} className="space-y-6 overflow-hidden">
      <LibSingleEliminationBracket
        matches={libMatches}
        matchComponent={MaiaMatch}
        theme={bracketTheme}
        options={{
          style: {
            roundHeader: {
              backgroundColor: "#0a0a0a",
              fontColor: "#fafafa",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: 14,
            },
            connectorColor: "#52525b",
            connectorColorHighlight: "#fb8527",
            ...OPTIONS_BY_SIZE[size],
          },
        }}
        onMatchClick={(args) => {
          if (!onMatchClick) return;
          const id = typeof args.match.id === "string" ? Number(args.match.id) : args.match.id;
          const original = matchById.get(id);
          if (original) onMatchClick(original);
        }}
        svgWrapper={({ children, bracketWidth, bracketHeight, ...rest }) => (
          <SVGViewer
            width={width}
            height={containerHeight}
            bracketWidth={bracketWidth}
            bracketHeight={bracketHeight}
            // Pan-zoom chrome: hide both miniature and toolbar so the bracket
            // sits flush against our card. The lib forwards extra props to
            // ReactSVGPanZoom, so background colors and panel hides land here.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({
              background: "transparent",
              SVGBackground: "transparent",
              miniatureProps: { position: "none" },
              toolbarProps: { position: "none" },
            } as any)}
            {...rest}
          >
            {children}
          </SVGViewer>
        )}
      />

      {thirdPlaceMatch ? (
        <div className="flex flex-col items-center gap-2 border-t border-border pt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Third place match
          </p>
          <StandaloneMatchCard
            match={thirdPlaceMatch}
            onClick={onMatchClick ? () => onMatchClick(thirdPlaceMatch) : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
