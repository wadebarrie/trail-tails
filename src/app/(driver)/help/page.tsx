import { HelpGuide } from "@/features/help/components/help-guide";
import { requireDriverAccess } from "@/features/auth/queries";

export default async function DriverHelpPage() {
  await requireDriverAccess();

  return (
    <HelpGuide variant="driver" backHref="/today" backLabel="Back to Today" />
  );
}
