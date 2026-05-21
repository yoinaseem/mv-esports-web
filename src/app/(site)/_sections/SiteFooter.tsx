import Link from "next/link";

const FOOTER_LINKS: ReadonlyArray<{ heading: string; items: ReadonlyArray<{ label: string; href: string }> }> = [
  {
    heading: "Platform",
    items: [
      { label: "Tournaments", href: "/tournaments" },
      { label: "Games", href: "/games" },
      { label: "Host an event", href: "/register?role=host" },
    ],
  },
  {
    heading: "About",
    items: [
      { label: "About MV Esports", href: "/about" },
      { label: "Contact", href: "mailto:hello@mvesports.mv" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-primary/30 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="font-heading inline-flex items-baseline gap-1 text-lg font-semibold uppercase tracking-[0.2em]"
            >
              <span className="text-primary">MV</span>
              <span>Esports</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Open brackets and public results for the Maldivian competitive scene.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <p className="kicker mb-4">{group.heading}</p>
              <ul className="flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-primary/30 pt-6 font-mono text-xs text-muted-foreground">
          <span>© 2026 MV Esports</span>
          <span>Built for the local scene · open by default</span>
        </div>
      </div>
    </footer>
  );
}
