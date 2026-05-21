"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SlantedButton } from "@/components/site/SlantedButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Public-site nav. Add entries as pages land. Linking ahead of pages 404s and is
// noisier than just leaving them out — populate this list when targets exist.
const navLinks: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/games", label: "Games" },
  { href: "/about", label: "About" },
];

const ADMIN_ROLES = ["system_manager", "superadmin"] as const;

function getDisplayName(user: AuthUser): string {
  return user.display_name?.trim() || user.name?.trim() || user.email;
}

function getInitials(user: AuthUser): string {
  const source = user.display_name?.trim() || user.name?.trim() || user.email;
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
  return initials || user.email[0]?.toUpperCase() || "?";
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-baseline gap-1 text-xl font-bold uppercase tracking-[0.18em] leading-none",
        className,
      )}
    >
      <span className="text-primary">MV</span>
      <span>Esports</span>
    </span>
  );
}

const ALWAYS_VISIBLE_THRESHOLD = 80;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, hasRole, hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    // Near the top, always show.
    if (latest < ALWAYS_VISIBLE_THRESHOLD) {
      if (hidden) setHidden(false);
      return;
    }
    // Don't auto-hide while the mobile sheet is open — would yank the trigger
    // out from under the user.
    if (mobileOpen) return;
    // Scrolling down → hide. Scrolling up → show. Skip micro-scrolls.
    const delta = latest - previous;
    if (delta > 4) setHidden(true);
    else if (delta < -4) setHidden(false);
  });

  const isAdmin = ADMIN_ROLES.some((role) => hasRole(role));
  const canHostTournaments = hasPermission("tournaments.create");

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <motion.header
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:gap-10">
          <Link href="/" aria-label="MV Esports home">
            <Wordmark />
          </Link>

          {navLinks.length > 0 ? (
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
              {navLinks.map(({ href, label }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "font-display text-sm font-semibold uppercase tracking-wider transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-3">
            {loading ? (
              <div aria-hidden className="size-9" />
            ) : isAuthenticated && user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Account menu"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  {canHostTournaments || isAdmin ? <DropdownMenuSeparator /> : null}
                  {canHostTournaments ? (
                    <DropdownMenuItem onSelect={() => router.push("/host/tournaments/new")}>
                      Create tournament
                    </DropdownMenuItem>
                  ) : null}
                  {isAdmin ? (
                    <DropdownMenuItem onSelect={() => router.push("/admin")}>
                      Admin panel
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <SlantedButton variant="outline" size="sm" href="/login">
                  Sign in
                </SlantedButton>
                <SlantedButton size="sm" href="/register">
                  Create account
                </SlantedButton>
              </div>
            )}

            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <SheetContent side="right" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border p-6">
            <SheetTitle className="sr-only">MV Esports menu</SheetTitle>
            <Wordmark className="text-base" />
          </SheetHeader>

          {navLinks.length > 0 ? (
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile primary">
              {navLinks.map(({ href, label }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "font-display px-3 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary",
                      )}
                    >
                      {label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          ) : null}

          <div className="mt-auto border-t border-border p-4">
            {loading ? (
              <div aria-hidden className="h-10" />
            ) : isAuthenticated && user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {canHostTournaments ? (
                    <SheetClose asChild>
                      <Link
                        href="/host/tournaments/new"
                        className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                      >
                        Create tournament
                      </Link>
                    </SheetClose>
                  ) : null}
                  {isAdmin ? (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                      >
                        Admin panel
                      </Link>
                    </SheetClose>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3">
                <SheetClose asChild>
                  <SlantedButton size="sm" href="/register">
                    Create account
                  </SlantedButton>
                </SheetClose>
                <SheetClose asChild>
                  <SlantedButton variant="outline" size="sm" href="/login">
                    Sign in
                  </SlantedButton>
                </SheetClose>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  );
}
