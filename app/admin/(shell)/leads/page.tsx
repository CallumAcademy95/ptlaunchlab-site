import { redirect } from "next/navigation";

// The Leads screen became the CRM (/admin/crm). Kept so old links and
// bookmarks still land somewhere useful.
export default function LeadsRedirect() {
  redirect("/admin/crm");
}
