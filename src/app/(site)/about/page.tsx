import type { Metadata } from "next";

import { PageHero } from "@/components/site/PageHero";
import { SlantedButton } from "@/components/site/SlantedButton";
import { about } from "@/content/about";
import { SiteFooter } from "../_sections/SiteFooter";

export const metadata: Metadata = {
  title: "About · MV Esports",
  description:
    "MV Esports is the public bracket tracker for the Maldivian competitive scene — open brackets, public results, no invite links required.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker={about.hero.kicker}
        title={about.hero.title}
        subtitle={about.hero.subtitle}
      />

      {/* Principles */}
      <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <header className="mb-12 flex flex-col gap-3">
            <span className="kicker">{about.principles.kicker}</span>
            <h2 className="display text-3xl sm:text-4xl">
              {about.principles.title}
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {about.principles.items.map((p) => (
              <article
                key={p.kicker}
                className="flex flex-col gap-3 border border-border bg-card/40 p-7"
              >
                <span className="kicker">{p.kicker}</span>
                <h3 className="font-semibold text-xl tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <header className="mb-12 flex flex-col gap-3">
            <span className="kicker">{about.pathways.kicker}</span>
            <h2 className="display text-3xl sm:text-4xl">
              {about.pathways.title}
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {about.pathways.items.map((p) => (
              <article
                key={p.kicker}
                className="flex flex-col gap-5 border border-border bg-card/40 p-8"
              >
                <span className="kicker">{p.kicker}</span>
                <h3 className="display text-2xl leading-tight sm:text-3xl">
                  {p.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
                <div className="mt-2">
                  <SlantedButton
                    href={p.cta.href}
                    variant={p.cta.variant}
                    size={p.cta.size}
                  >
                    {p.cta.label}
                  </SlantedButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-primary/30 bg-background py-20 sm:py-28">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6">
          <span className="kicker">{about.contact.kicker}</span>
          <h2 className="display text-3xl sm:text-4xl">
            {about.contact.title}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            {about.contact.bodyBefore}
            <a
              href={`mailto:${about.contact.email}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {about.contact.email}
            </a>
            {about.contact.bodyAfter}
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
