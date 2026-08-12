import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpotBoardSection } from "@/components/spot-board";
import { readSpotBoard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const board = await readSpotBoard();

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SpotBoardSection board={board} />
      </main>
      <SiteFooter />
    </>
  );
}
