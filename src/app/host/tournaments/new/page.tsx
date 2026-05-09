import type { Metadata } from "next";
import { TournamentCreateForm } from "@/components/tournaments/builder/TournamentCreateForm";

export const metadata: Metadata = {
  title: "New tournament",
};

export default function NewTournamentPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8 space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Tournament builder</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">New tournament</h1>
        <p className="text-sm text-muted-foreground">
          Configure the basics, schedule, and first stage. You&apos;ll add registrations, seeds, and
          generate the bracket from the builder once it&apos;s created.
        </p>
      </header>
      <TournamentCreateForm />
    </section>
  );
}
