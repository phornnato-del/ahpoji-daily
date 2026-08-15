"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", num: "00" },
  { href: "/goals", label: "Goals", num: "01" },
  { href: "/projects", label: "Projects", num: "02" },
  { href: "/activities", label: "Activities", num: "03" },
  { href: "/notes", label: "Notes", num: "04" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-ink-line px-5 py-6 md:py-10 md:sticky md:top-0 md:h-screen">
      <div className="mb-8">
        <div className="stamp text-amber text-[11px] mb-1">personal ledger</div>
        <h1 className="font-display text-2xl leading-tight text-paper">
          AHPOJI<br />DAILY
        </h1>
      </div>
      <nav className="flex md:flex-col gap-1 flex-wrap">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-ink-soft text-amber"
                  : "text-paper/70 hover:text-paper hover:bg-ink-soft/60"
              }`}
            >
              <span className="stamp text-[10px] text-paper/40 group-hover:text-teal">
                {item.num}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden md:block mt-10 pt-6 border-t border-ink-line stamp text-[10px] text-paper/30 leading-relaxed">
        <br />
        my_schedule va1.0.0<br />
      </div>
    </aside>
  );
}
