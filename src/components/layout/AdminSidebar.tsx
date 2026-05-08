"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type IconSvgObject,
  ArrowLeft02Icon,
  ArrowUpDownIcon,
  Award01Icon,
  DashboardSquare01Icon,
  GameController01Icon,
  Logout03Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";

import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgObject;
  exact?: boolean;
};

const overviewNav: ReadonlyArray<NavItem> = [
  { href: "/admin", label: "Dashboard", icon: DashboardSquare01Icon, exact: true },
];

const catalogNav: ReadonlyArray<NavItem> = [
  { href: "/admin/games", label: "Games", icon: GameController01Icon },
];

const operationsNav: ReadonlyArray<NavItem> = [
  { href: "/admin/hosts", label: "Tournament hosts", icon: UserMultipleIcon },
  { href: "/admin/tournaments", label: "Tournaments", icon: Award01Icon },
];

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

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const renderGroup = (label: string, items: ReadonlyArray<NavItem>) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.label}>
                <Link href={item.href}>
                  <HugeiconsIcon icon={item.icon} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label="MV Esports admin home"
        >
          <span className="font-heading inline-flex items-baseline gap-1 text-base font-semibold uppercase tracking-[0.2em]">
            <span className="text-primary">MV</span>
            <span className="group-data-[collapsible=icon]:hidden">Esports</span>
          </span>
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground group-data-[collapsible=icon]:hidden">
            Admin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {renderGroup("Overview", overviewNav)}
        {renderGroup("Catalog", catalogNav)}
        {renderGroup("Operations", operationsNav)}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={getDisplayName(user)}
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 min-w-0 text-left leading-tight">
                      <span className="truncate text-sm font-medium">{getDisplayName(user)}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <HugeiconsIcon icon={ArrowUpDownIcon} strokeWidth={1.75} className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                >
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/")}>
                    <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={1.75} />
                    Back to site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => void handleLogout()}>
                    <HugeiconsIcon icon={Logout03Icon} strokeWidth={1.75} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
