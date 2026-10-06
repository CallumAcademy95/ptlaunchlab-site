"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Circle,
  Gift,
  HelpCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { ADMIN_NAV, isActiveNav } from "../nav";

// The rail's links. Client-side only because it needs the current path to
// know what to highlight — everything else about the shell is server-rendered.
//
// Same shape as Praxel's SidebarNav: grouped, icon + label, the active entry
// filled rather than merely tinted.

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  building: Building2,
  gift: Gift,
  chart: BarChart3,
  message: MessageSquare,
  help: HelpCircle,
  send: Send,
};

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="space-y-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? Circle;
              const on = isActiveNav(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={`group flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    on
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                      on ? "text-white" : "text-slate-500 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.hint && (
                      <span
                        className={`mt-0.5 block text-[11px] leading-snug ${
                          on ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {item.hint}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
