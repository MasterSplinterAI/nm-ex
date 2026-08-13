import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpotBoardSection } from "@/components/spot-board";
import { readSpotBoard, readTinPolicy } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [board, policy] = await Promise.all([
    readSpotBoard(),
    readTinPolicy(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SpotBoardSection board={board} policy={policy} />
      </main>
      <SiteFooter />
    </>
  );
}
