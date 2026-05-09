import type { Metadata } from "next";
import { HostProtectedRoute } from "@/components/auth/host-protected-route";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Host | MV Esports",
    template: "%s | MV Esports",
  },
};

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HostProtectedRoute>
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <Toaster />
    </HostProtectedRoute>
  );
}
