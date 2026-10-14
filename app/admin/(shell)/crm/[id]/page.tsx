import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AdminPage } from "../../ui/praxel";
import { isUuid } from "../crm";
import { PersonPanel } from "../PersonPanel";

// One person, full screen: what a phone opens from the CRM list. The same
// panel as the desktop drawer (/admin/crm?open=<id>).

export const metadata: Metadata = {
  title: "Person — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CrmPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  return (
    <AdminPage>
      <Link
        href="/admin/crm"
        className="-ml-1 -mb-2 inline-flex min-h-11 items-center gap-1 px-1 text-sm text-slate-500 transition hover:text-slate-800 md:min-h-0"
      >
        <ChevronLeft className="h-4 w-4" /> CRM
      </Link>
      <PersonPanel id={id} />
    </AdminPage>
  );
}
