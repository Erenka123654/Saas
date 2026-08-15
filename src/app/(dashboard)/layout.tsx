import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveMembership } from "@/lib/org";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const { memberships, active } = await getActiveMembership(session.user.id);

  return (
    <div className="min-h-screen bg-stone-100">
      <DashboardNav
        userName={session.user.name ?? ""}
        organizations={memberships.map((m) => ({ id: m.organizationId, name: m.organization.name, role: m.role }))}
        activeOrgId={active?.organizationId ?? null}
      />
      <main className="max-w-5xl mx-auto p-4 sm:p-8">{children}</main>
    </div>
  );
}
