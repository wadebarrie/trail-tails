import { HelpGuide } from "@/features/help/components/help-guide";
import { requireRole } from "@/features/auth/queries";

export default async function AdminHelpPage() {
  await requireRole("admin");

  return (
    <HelpGuide
      variant="admin"
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
