"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const NAV = [
  { href: "/dashboards", label: "Dashboards", icon: "grid" },
  { href: "/data", label: "Data", icon: "db" },
];

const STORAGE_KEY = "gridboard:sidebar";

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <g fill="#ffffff">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" />
        <rect x="9" y="1.5" width="5.5" height="5.5" fillOpacity="0.55" />
        <rect x="1.5" y="9" width="5.5" height="5.5" fillOpacity="0.55" />
        <rect x="9" y="9" width="5.5" height="5.5" />
      </g>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "collapsed");
    } catch {
      /* storage unavailable */
    }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <aside
      className={`relative sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-line bg-surface text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
      >
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={14} />
      </button>

      <div
        className={`flex h-16 shrink-0 items-center border-b border-line ${
          collapsed ? "justify-center" : "gap-2 px-4"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary">
          <LogoMark />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold text-ink">
              Gridboard
            </div>
            <div className="truncate text-[11px] text-ink-3">
              SQL dashboard builder
            </div>
          </div>
        )}
      </div>

      <nav
        className={`flex flex-col gap-1 p-2 ${collapsed ? "items-center" : ""}`}
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const tone = active
            ? "bg-primary-tint text-primary"
            : "text-ink-2 hover:bg-raised hover:text-ink";
          return collapsed ? (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${tone}`}
            >
              <Icon name={item.icon} size={16} />
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-8 items-center gap-2 rounded px-2 text-[13px] font-medium transition-colors ${tone}`}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
