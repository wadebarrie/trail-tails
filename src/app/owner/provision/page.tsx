import { PageHeader, TableShell } from "@/features/admin/components/ui";
import { CreateCompanyInviteForm } from "@/features/platform/components/create-company-invite-form";
import { OnboardingGuide } from "@/features/platform/components/onboarding-guide";
import {
  listCompaniesForOwner,
  listInvitesForOwner,
} from "@/features/platform/queries";
import { areInvitesEnabled } from "@/features/platform/settings";

export const dynamic = "force-dynamic";

export default async function OwnerProvisionPage() {
  const [companies, invites, invitesEnabled] = await Promise.all([
    listCompaniesForOwner(),
    listInvitesForOwner(),
    areInvitesEnabled(),
  ]);

  return (
    <div>
      <PageHeader
        title="Beta provisioning"
        description="Create beta companies and send one-time admin invite links."
      />

      <div className="mb-10">
        <OnboardingGuide />
      </div>

      {!invitesEnabled ? (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          New company signups are paused. Enable them in{" "}
          <a href="/owner/settings" className="font-medium underline">
            Owner → Settings
          </a>
          .
        </p>
      ) : null}

      <CreateCompanyInviteForm invitesEnabled={invitesEnabled} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Recent invites</h2>
        <TableShell minWidth="48rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-stone-500">
                    No invites yet.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const company = invite.companies as
                    | { name: string }
                    | { name: string }[]
                    | null;
                  const companyName = Array.isArray(company)
                    ? company[0]?.name
                    : company?.name;

                  let status = "Pending";
                  if (invite.accepted_at) status = "Accepted";
                  else if (new Date(invite.expires_at) < new Date()) status = "Expired";

                  return (
                    <tr key={invite.id}>
                      <td className="px-4 py-3 text-stone-900">
                        {companyName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-900">{invite.full_name ?? "—"}</div>
                        <div className="text-stone-500">{invite.email}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-700">{status}</td>
                      <td className="px-4 py-3 text-stone-500">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableShell>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">All companies</h2>
        <TableShell minWidth="36rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Timezone</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-4 py-3 text-stone-900">{company.name}</td>
                  <td className="px-4 py-3 text-stone-600">{company.timezone}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>
    </div>
  );
}
