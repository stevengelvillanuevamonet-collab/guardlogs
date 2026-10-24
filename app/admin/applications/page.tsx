import { listApplications } from "@/lib/admin-actions";
import { ApplicationsPanel } from "@/components/admin/applications-panel";
import { PageTitle } from "@/components/admin/page-title";

export const metadata = { title: "Applications — EGardMo" };

// Admin page: review pending and past guard applications.
export default async function ApplicationsPage() {
  // Load all applications server-side.
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
