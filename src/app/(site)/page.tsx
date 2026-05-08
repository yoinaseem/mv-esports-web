import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-8 px-6 py-24">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">MV Esports</p>
        <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Maldivian eSports tournaments —<br />
          open brackets, public results.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Bracket structure, match results, and stream links you can actually
          follow. Built for the local scene, open by default.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/register">Create account</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </section>
  );
}
