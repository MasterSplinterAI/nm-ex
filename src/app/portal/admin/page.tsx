import { redirect } from "next/navigation";
import { demoNowIso } from "@/lib/dmo/clock";
import { tabFromSearch } from "@/lib/dmo/nav";
import { participantById } from "@/lib/dmo/queries";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { AuditTab } from "./tabs/audit";
import { CertificatesTab } from "./tabs/certificates";
import { DemoTab } from "./tabs/demo";
import { EntityDossier } from "./tabs/entity";
import { AdminHome } from "./tabs/home";
import { InspectionsTab } from "./tabs/inspections";
import { LotDossier } from "./tabs/lot";
import { OffersTab } from "./tabs/offers";
import { PolicyTab } from "./tabs/policy";
import { ProvenanceView } from "./tabs/provenance";
import { RegistrationsTab } from "./tabs/registrations";
import { ReportsTab } from "./tabs/reports";
import { RoyaltyTab } from "./tabs/royalty";
import { SettlementsTab } from "./tabs/settlements";

export const dynamic = "force-dynamic";

const TABS = ["home", "registrations", "inspections", "offers", "settlements", "certificates", "royalty", "reports", "audit", "policy", "demo"] as const;
type TabId = (typeof TABS)[number];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; entity?: string; lot?: string; trace?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "officer") redirect("/portal");
  const { tab, entity, lot, trace } = await searchParams;
  const active = tabFromSearch(tab);
  const current: TabId = TABS.includes(active as TabId) ? (active as TabId) : "home";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const nowIso = demoNowIso(state);
  const me = participantById(state, session.participantId)!;

  // A trace or a lot reference is meaningful from any tab, so it wins over the
  // tab content rather than forcing the officer back through the menu.
  if (trace) return <ProvenanceView state={state} reference={trace} />;
  if (lot) return <LotDossier state={state} lotId={lot} />;

  return (
    <>
      {current === "home" && <AdminHome state={state} board={board} nowIso={nowIso} me={me} />}
      {current === "registrations" && entity && <EntityDossier state={state} entityId={entity} />}
      {current === "registrations" && !entity && (
        <>
          <PageHeader
            kicker="Operations"
            title="Registrations"
            lede="Approve, request more information, reject or suspend. Submission never activates an account on its own. Open any participant to see everything the registry holds on them."
          />
          <RegistrationsTab state={state} />
        </>
      )}
      {current === "inspections" && (
        <>
          <PageHeader kicker="Operations" title="Inspections" lede="Receive the sample, enter the official assay, lock it to the lot and open the domestic offer." />
          <InspectionsTab state={state} board={board} nowIso={nowIso} />
        </>
      )}
      {current === "offers" && (
        <>
          <PageHeader kicker="Market" title="National Pool" lede="Concentrate is offered to smelters. Refined tin is offered to domestic buyers. Those are two different boards." />
          <OffersTab state={state} board={board} nowIso={nowIso} />
        </>
      )}
      {current === "royalty" && (
        <>
          <PageHeader
            kicker="Fiscal"
            title="Royalty ledger"
            lede="Every royalty liability on the register: what was assessed, who carries it now, and whether NM-EX has been paid."
          />
          <RoyaltyTab state={state} />
        </>
      )}
      {current === "settlements" && (
        <>
          <PageHeader kicker="Operations" title="Settlements" lede="Record payment and collection, or default an unpaid acceptance and return the lot to the pool." />
          <SettlementsTab state={state} nowIso={nowIso} />
        </>
      )}
      {current === "certificates" && (
        <>
          <PageHeader kicker="Register" title="Certificates" lede="Status controls for every DMO certificate. UTILIZED, CANCELLED and SUPERSEDED are terminal." />
          <CertificatesTab state={state} />
        </>
      )}
      {current === "reports" && <ReportsTab state={state} />}
      {current === "audit" && (
        <>
          <PageHeader kicker="Register" title="Audit trail" lede="Immutable append-only events. The electronic record is authoritative." />
          <AuditTab state={state} />
        </>
      )}
      {current === "policy" && (
        <>
          <PageHeader kicker="Control" title="Policy" lede="Ministry levers. Changes apply to new lots and certificates only." />
          <PolicyTab state={state} />
        </>
      )}
      {current === "demo" && (
        <>
          <PageHeader kicker="Presentation" title="Demo controls" lede="Advance the clock or rebuild the seeded scenario between walkthroughs." />
          <DemoTab state={state} nowIso={nowIso} />
        </>
      )}
    </>
  );
}
