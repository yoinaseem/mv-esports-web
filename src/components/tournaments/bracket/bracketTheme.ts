import { createTheme } from "@g-loot/react-tournament-brackets";

// Match the maia dark palette + brand orange. The library mixes won/lost
// background colors so participants on the winning side highlight clearly.
// Hex equivalents of our --primary and the maia dark-mode tokens — the lib
// doesn't read CSS variables, so we have to hand-resolve.
export const bracketTheme = createTheme({
  textColor: {
    main: "#fafafa",
    highlighted: "#ffffff",
    dark: "#000000",
    disabled: "#71717a",
  },
  matchBackground: {
    wonColor: "#fb8527", // primary
    lostColor: "#1f1f1f", // muted-ish dark
  },
  score: {
    background: {
      wonColor: "#fb923c", // primary-hover
      lostColor: "#27272a", // border-ish
    },
    text: {
      highlightedWonColor: "#000000",
      highlightedLostColor: "#a1a1aa",
    },
  },
  border: {
    color: "#27272a",
    highlightedColor: "#fb8527",
  },
  roundHeaders: {
    background: "#1a1a1a",
  },
  canvasBackground: "transparent",
  fontFamily: "var(--font-sans), Arial, sans-serif",
  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  disabledColor: "#52525b",
});
