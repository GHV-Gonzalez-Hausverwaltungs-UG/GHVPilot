"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ClipboardList,
  Settings,
  User,
  LogOut,
  PlusCircle,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabaseclient";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import Image from "next/image";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  {
    href: "/",
    label: "Besichtigungen",
    icon: ClipboardList,
  },
  {
    href: "/besichtigung/neue",
    label: "Neue Besichtigung",
    icon: PlusCircle,
  },
];

export default function DashboardShell({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false); // mobile
  const [isCollapsed, setIsCollapsed] = React.useState(false); // desktop mini
  const [signingOut, setSigningOut] = React.useState(false);
  const router = useRouter();
  const { user, profile } = useCurrentProfile();

  const displayName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      profile.role ||
      user?.email ||
      "Benutzer"
    : user?.email || "Gast";

  async function handleLogout() {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  // Klassen für Breite / Margin je nach Collapsed-Zustand
  const sidebarWidthClass = isCollapsed ? "w-16" : "w-64";
  const contentMarginClass = isCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-100">
      {/* Overlay für Mobile */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Sidebar schließen"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col justify-between
          border-r border-zinc-800 bg-[#0b0b0b] p-4
          transform transition-transform duration-200 ease-out

          ${sidebarWidthClass}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col gap-6">
          {/* Logo / Brand */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/80">
              <Image
                src="/icons/icon-512.png"
                alt="GHV Logo"
                width={20}
                height={20}
                className="w-full h-full"
              />
            </div>
            {/* Logo-Text nur wenn nicht collapsed */}
            {!isCollapsed && (
              <div className="transition-opacity duration-150">
                <div className="text-sm font-semibold tracking-tight">
                  GHV Pilot
                </div>
                <div className="text-[11px] text-zinc-400">
                  Internes Dashboard
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden md:flex  px-2 py-1 text-zinc-300 hover:bg-zinc-500"
            >
              {isCollapsed ? (
                <ChevronsRight className="h-5 w-5" />
              ) : (
                <ChevronsLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 rounded-md px-2 py-2 text-sm
                    transition-colors
                    ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 border border-blue-600/40"
                        : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {/* Label ausblenden wenn collapsed */}
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar */}
        <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500 flex flex-col gap-3">
          {/* Collapse-Toggle nur Desktop */}

          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full gap-1 rounded-xl border border-red-500
              text-red-400 cursor-pointer hover:bg-red-400/10 px-2 py-2
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className="h-3 w-3" />
            {!isCollapsed && <span>Abmelden</span>}
          </button>

          <div
            className={`
              flex items-center justify-between
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            {!isCollapsed && <span>v0.1.0</span>}
            <Link
              href="/settings"
              className={`
                flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <Settings className="h-3 w-3" />
              {!isCollapsed && <span>Einstellungen</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Content-Bereich */}
      <div
        className={`
          flex min-h-screen flex-1 flex-col
          ${contentMarginClass}
          transition-[margin] duration-200
        `}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-[#050505]/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-2 md:px-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {/* Mobile Toggle */}
                <button
                  className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/60 p-1 text-zinc-200 md:hidden"
                  onClick={() => setSidebarOpen((s) => !s)}
                  aria-label="Sidebar öffnen"
                >
                  {sidebarOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </button>
                <div className="hidden text-xs font-medium text-zinc-400 md:block">
                  Dashboard
                </div>
              </div>

              <Breadcrumbs />
            </div>

            {/* Rechts: User / Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-[3px] text-xs">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">Angemeldet</span>
              </div>

              <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs hover:border-zinc-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/80 text-[11px] font-semibold">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="hidden text-zinc-200 sm:inline">
                  {displayName}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Hauptinhalt */}
        <main className="flex-1 bg-[#050505]">
          <div className="mx-auto w-full px-3 py-4 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
