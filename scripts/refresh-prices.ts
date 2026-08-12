import { refreshSpotBoard } from "../src/lib/refresh";

async function main() {
  console.log("Refreshing NM-EX spot board…");
  const board = await refreshSpotBoard();
  console.log(`Updated at ${board.updatedAt}`);
  console.log(`USD/NGN ${board.fx.rate} (${board.fx.source})`);
  for (const m of board.minerals) {
    console.log(
      `  ${m.name.padEnd(22)} last=${m.lastUsd ?? "—"} open=${m.openUsd ?? "—"} close=${m.closeUsd ?? "—"} [${m.status}]`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
