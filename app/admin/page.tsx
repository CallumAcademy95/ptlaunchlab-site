import { redirect } from "next/navigation";

// /admin has no page of its own; the shell's pages all live under it.
// Middleware has already required the admin cookie before this runs.
export default function AdminIndex() {
  redirect("/admin/leads");
}
