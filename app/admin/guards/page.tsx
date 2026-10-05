import { listGuards } from "@/lib/admin-actions";
import { getSessionUser } from "@/lib/auth";
import { GuardsPanel } from "@/components/admin/guards-panel";
import { PageTitle } from "@/components/admin/page-title";

export const metadata = { title: "Guards — EGardMo" };

export default async function GuardsPage() {
  const [guards, session] = await Promise.all([listGuards(), getSessionUser()]);

  return (
    <>
      <PageTitle
        title="Guards"
        description="Register security guards directly, reset passwords, or switch an account off."
      />
      <GuardsPanel guards={guards} currentUserId={session?.user.id ?? ""} />
    </>
  );
}
