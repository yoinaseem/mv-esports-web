// About-page content. Plain typed data — pages import + render. Swap this
// whole file for a fetch when a CMS lands.

import type { CTAConfig } from "./home";

export type AboutPrinciple = {
  kicker: string;
  title: string;
  body: string;
};

export type AboutPathway = {
  kicker: string;
  title: string;
  body: string;
  cta: CTAConfig;
};

export type AboutContent = {
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
  };
  principles: {
    kicker: string;
    title: string;
    items: ReadonlyArray<AboutPrinciple>;
  };
  pathways: {
    kicker: string;
    title: string;
    items: ReadonlyArray<AboutPathway>;
  };
  contact: {
    kicker: string;
    title: string;
    bodyBefore: string;
    email: string;
    bodyAfter: string;
  };
};

export const about: AboutContent = {
  hero: {
    kicker: "About · MV Esports",
    title: "Open by default.",
    subtitle:
      "MV Esports is the public bracket tracker for the Maldivian competitive scene. We exist because watching a tournament shouldn't require an invite link, a screenshot of a Discord message, or a friend who follows the right group chats.",
  },
  principles: {
    kicker: "What we do",
    title: "Three things, plainly.",
    items: [
      {
        kicker: "01 · Brackets",
        title: "Updates in real time",
        body: "Single-elimination, double-elimination, round-robin, group stages. Seeded matchups are visible from day one and stage transitions go live the moment they happen.",
      },
      {
        kicker: "02 · Results",
        title: "On the record",
        body: "Per-game scores, best-of overrides, win/loss as it stands. Results don't get retconned in a Discord thread three days later — they're public, dated, and linkable.",
      },
      {
        kicker: "03 · Access",
        title: "Open registration",
        body: "Anyone can compete or host. New game catalogue submissions and host accounts get reviewed in days, not weeks. No invite list, no gatekeeping.",
      },
    ],
  },
  pathways: {
    kicker: "Get involved",
    title: "Two pathways. Same platform.",
    items: [
      {
        kicker: "For players",
        title: "Show up, play, stay on the record.",
        body: "Create an account, register for an open tournament, show up. Your matches and results stay public and linkable — useful when scrim partners ask for your history or when teams come scouting.",
        cta: { label: "Create account", href: "/register", size: "sm" },
      },
      {
        kicker: "For hosts",
        title: "Run a tournament without the spreadsheet.",
        body: "Apply for a host account. Schedule brackets in any combination of stage types, manage registrations and approvals, report match scores — all from one place. No ad-hoc Discord pings, no separate scorekeeper.",
        cta: {
          label: "Apply to host",
          href: "/register?role=host",
          size: "sm",
        },
      },
    ],
  },
  contact: {
    kicker: "Contact",
    title: "Reach us.",
    bodyBefore:
      "For game catalogue submissions, host applications, partnerships, or any other questions, email ",
    email: "hello@mvesports.mv",
    bodyAfter: ". We try to reply within two business days.",
  },
};
