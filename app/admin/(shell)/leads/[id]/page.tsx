import { redirect } from "next/navigation";

// A lead's page is now the CRM panel. Leads Central's phone alerts still link
// here (/admin/leads/<consultation id>), so this must keep working.
export default async function LeadRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/crm?open=${encodeURIComponent(id)}`);
}
