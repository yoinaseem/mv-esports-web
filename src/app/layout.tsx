import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Figtree,
  Saira_Condensed,
} from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display tier — Saira Condensed. Used by the `display` utility for hero / H1
// / section headings. Body and UI stay Figtree.
const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-saira",
});

export const metadata: Metadata = {
  title: "MV Esports",
  description: "Maldivian eSports tournaments — open brackets, public results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        figtree.variable,
        saira.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
