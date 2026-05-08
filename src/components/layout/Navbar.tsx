"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

// Public-site nav. Add entries as pages land. Linking ahead of pages 404s and is
// noisier than just leaving them out — populate this list when targets exist.
const navLinks: ReadonlyArray<{ href: string; label: string }> = [];

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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = ADMIN_ROLES.some((role) => hasRole(role));

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
          <Link
            href="/"
            aria-label="MV Esports home"
            className="font-heading inline-flex items-baseline gap-1 text-lg font-semibold uppercase tracking-[0.2em]"
          >
            <span className="text-primary">MV</span>
            <span>Esports</span>
          </Link>

          {navLinks.length > 0 ? (
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={
                      active
                        ? "text-sm font-medium text-foreground"
                        : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <div aria-hidden className="size-8" />
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

                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => router.push("/admin")}>
                        Admin panel
                      </DropdownMenuItem>
                    </>
                  ) : null}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Create account</Link>
                </Button>
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
            <SheetTitle className="font-heading text-base uppercase tracking-[0.2em]">
              <span className="text-primary">MV</span> Esports
            </SheetTitle>
          </SheetHeader>

          {navLinks.length > 0 ? (
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile primary">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className={
                        active
                          ? "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-muted"
                          : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
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
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/register">Create account</Link>
                  </Button>
                </SheetClose>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
