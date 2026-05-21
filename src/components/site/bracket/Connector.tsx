"use client";

// dasharray + initial dashoffset are computed in JS from these constants
// (rather than CSS vars) because vector-effect: non-scaling-stroke measures
// dashes in screen pixels and var() inheritance through SVG ancestors was
// unreliable. Keep in sync with globals.css and helpers.ts.
const MATCH_HEIGHT = 84;
const ROW_GAP = 28;
const COL_GAP = 80;

function wbHalfSibling(round: number): number {
  return (MATCH_HEIGHT + ROW_GAP) * Math.pow(2, round - 2);
}

function lbHalfSibling(round: number): number {
  const group = Math.pow(2, Math.floor((round - 1) / 2));
  return (MATCH_HEIGHT + ROW_GAP) * (group / 2);
}

type ConnectorProps = {
  variant: "pair-up" | "feed";
  isTopChild?: boolean;
  isActive: boolean;
  // Pair-up only — pick the right halfSibling formula.
  bracketType?: "wb" | "lb";
  round?: number;
};

export function Connector({
  variant,
  isTopChild,
  isActive,
  bracketType,
  round,
}: ConnectorProps) {
  let length: number;
  if (variant === "feed") {
    length = COL_GAP;
  } else {
    const halfSibling =
      bracketType === "lb"
        ? lbHalfSibling(round ?? 1)
        : wbHalfSibling(round ?? 1);
    length = COL_GAP + halfSibling;
  }

  const activeStyle: React.CSSProperties = {
    strokeDasharray: length,
    strokeDashoffset: isActive ? 0 : length,
  };

  if (variant === "feed") {
    return (
      <svg
        aria-hidden
        className="site-bracket-connector"
        data-direction="feed"
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="2"
          x2="100"
          y2="2"
          className="site-bracket-connector-base"
        />
        <line
          x1="0"
          y1="2"
          x2="100"
          y2="2"
          className="site-bracket-connector-active"
          style={activeStyle}
        />
      </svg>
    );
  }

  const path = isTopChild
    ? "M 0 0 L 50 0 L 50 100 L 100 100"
    : "M 0 100 L 50 100 L 50 0 L 100 0";

  return (
    <svg
      aria-hidden
      className="site-bracket-connector"
      data-direction={isTopChild ? "top" : "bottom"}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path d={path} className="site-bracket-connector-base" />
      <path
        d={path}
        className="site-bracket-connector-active"
        style={activeStyle}
      />
    </svg>
  );
}
