"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type LinkDef = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
};

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  const links: LinkDef[] = [
    { href: "/", label: "Dashboard", exact: true },
    { href: "/clientes", label: "Clientes" },
    { href: "/os", label: "Ordens de Serviço" },
    { href: "/contas-receber", label: "Contas a Receber", badge: pendingCount },
  ];

  return (
    <aside className="w-56 bg-zinc-950 text-zinc-100 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span className="font-bold text-white text-base tracking-tight">Manager Lite</span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 pl-3.5">Gestão de Oficina</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-red-700 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <span>{link.label}</span>
              {link.badge != null && link.badge > 0 && (
                <span className="rounded-full bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
