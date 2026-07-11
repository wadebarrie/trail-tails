import { requireAdminApiAccess } from "@/features/auth/admin-api";
import { buildImportTemplateCsv } from "@/features/import/csv-template";

export async function GET(request: Request) {
  const access = await requireAdminApiAccess();
  if ("response" in access) return access.response;

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
