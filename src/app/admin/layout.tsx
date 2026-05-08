import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Admin | MV Esports",
    template: "%s | MV Esports Admin",
  },
};

const ADMIN_ROLES = ["system_manager", "superadmin"] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES} loginPath="/login" unauthorizedPath="/">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4" />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
}
