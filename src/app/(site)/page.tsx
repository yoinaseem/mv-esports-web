import { HeroSection } from "./_sections/HeroSection";
import { FeaturedTournaments } from "./_sections/FeaturedTournaments";
import { GamesGrid } from "./_sections/GamesGrid";
import { HostCTA } from "./_sections/HostCTA";
import { SiteFooter } from "./_sections/SiteFooter";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedTournaments />
      <GamesGrid />
      <HostCTA />
      <SiteFooter />
    </>
  );
}
