import { SlantedButton } from "@/components/site/SlantedButton";

export function HostCTA() {
  return (
    <section className="relative border-t border-primary/30 bg-background py-24 sm:py-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-7 px-6">
        <span className="kicker">For hosts</span>
        <h2 className="display max-w-3xl text-[clamp(2rem,6vw,3.75rem)] leading-[0.92]">
          Run your own tournament.
          <br />
          Free, open, on the record.
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Apply for a host account and start scheduling brackets, managing
          registrations, and publishing match results in minutes.
        </p>
        <div className="mt-2 flex flex-wrap gap-5">
          <SlantedButton href="/register?role=host">Apply to host</SlantedButton>
          <SlantedButton variant="outline" href="/about">
            Learn more
          </SlantedButton>
        </div>
      </div>
    </section>
  );
}
