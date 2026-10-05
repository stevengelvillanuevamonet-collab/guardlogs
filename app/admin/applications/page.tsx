import { listApplications } from "@/lib/admin-actions";
import { ApplicationsPanel } from "@/components/admin/applications-panel";
import { PageTitle } from "@/components/admin/page-title";

export const metadata = { title: "Applications — EGardMo" };

export default async function ApplicationsPage() {
  const applications = await listApplications();

  return (
    <>
      <PageTitle
        title="Guard applications"
        description="Check each applicant before they become a security guard. Approving creates their login."
      />
      <ApplicationsPanel applications={applications} />
    </>
  );
}
