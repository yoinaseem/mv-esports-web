import { PageHero } from "@/components/site/PageHero";
import { SlantedButton } from "@/components/site/SlantedButton";
import { homeHero } from "@/content/home";

// Home-page hero. Content comes from src/content/home.ts — swap that import
// for a fetch when a CMS arrives.
export function HeroSection() {
  return (
    <PageHero
      kicker={homeHero.kicker}
      title={homeHero.title}
      subtitle={homeHero.subtitle}
      actions={
        <>
          {homeHero.ctas.map((cta) => (
            <SlantedButton
              key={cta.label}
              href={cta.href}
              variant={cta.variant}
              size={cta.size}
            >
              {cta.label}
            </SlantedButton>
          ))}
        </>
      }
    />
  );
}
