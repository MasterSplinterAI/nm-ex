import { redirect } from "next/navigation";
import { Tabs } from "@/components/portal/tabs";
import { demoNowIso } from "@/lib/dmo/clock";
import { getSession } from "@/lib/dmo/session";
import { readState } from "@/lib/dmo/store";
import { inspectionQueue, openOffers, pendingAcceptances, pendingRegistrations } from "@/lib/dmo/queries";
import { readSpotBoard } from "@/lib/store";
import { PageHeader } from "../page-header";
import { AuditTab } from "./tabs/audit";
import { CertificatesTab } from "./tabs/certificates";
import { DemoTab } from "./tabs/demo";
import { InspectionsTab } from "./tabs/inspections";
import { OffersTab } from "./tabs/offers";
import { OverviewTab } from "./tabs/overview";
import { PolicyTab } from "./tabs/policy";
import { RegistrationsTab } from "./tabs/registrations";
import { SettlementsTab } from "./tabs/settlements";

export const dynamic = "force-dynamic";

const TAB_IDS = ["overview", "registrations", "inspections", "offers", "settlements", "certificates", "audit", "policy", "demo"] as const;
type TabId = (typeof TAB_IDS)[number];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "officer") redirect("/portal");
  const { tab } = await searchParams;
  const active: TabId = TAB_IDS.includes(tab as TabId) ? (tab as TabId) : "overview";

  const [state, board] = await Promise.all([readState(), readSpotBoard()]);
  const nowIso = demoNowIso(state);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "registrations", label: "Registrations", badge: pendingRegistrations(state).length },
    { id: "inspections", label: "Inspections", badge: inspectionQueue(state).length },
    { id: "offers", label: "Offers", badge: openOffers(state).length },
    { id: "settlements", label: "Settlements", badge: pendingAcceptances(state).length },
    { id: "certificates", label: "Certificates" },
    { id: "audit", label: "Audit trail" },
    { id: "policy", label: "Policy" },
    { id: "demo", label: "Demo controls" },
  ];

  return (
    <>
      <PageHeader
        kicker="NM-EX officer console"
        title="Compliance & market operations"
        lede="Approve participants, lock assays, run the domestic offer window, issue and control DMO certificates."
      />
      <Tabs base="/portal/admin" tabs={tabs} active={active} />
      {active === "overview" && <OverviewTab state={state} board={board} nowIso={nowIso} />}
      {active === "registrations" && <RegistrationsTab state={state} />}
      {active === "inspections" && <InspectionsTab state={state} board={board} nowIso={nowIso} />}
      {active === "offers" && <OffersTab state={state} board={board} nowIso={nowIso} />}
      {active === "settlements" && <SettlementsTab state={state} nowIso={nowIso} />}
      {active === "certificates" && <CertificatesTab state={state} />}
      {active === "audit" && <AuditTab state={state} />}
      {active === "policy" && <PolicyTab state={state} />}
      {active === "demo" && <DemoTab state={state} nowIso={nowIso} />}
    </>
  );
}
