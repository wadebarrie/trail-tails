import { canAccessAdmin } from "@/features/auth/access";
import { getCurrentProfile } from "@/features/auth/queries";
import { buildImportTemplateCsv } from "@/features/import/csv-template";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || !canAccessAdmin(profile)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeExamples = searchParams.get("examples") !== "0";

  const csv = buildImportTemplateCsv(includeExamples);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="packroute-import-template.csv"',
    },
  });
}
