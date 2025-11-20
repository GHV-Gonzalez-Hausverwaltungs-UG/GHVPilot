"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  Building2,
  Settings,
  User,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabaseclient";

import { useCurrentProfile } from "@/lib/useCurrentProfile";
import Image from "next/image";
import { Breadcrumbs } from "./Breadcrumbs";
import { Button } from "../ui/button";

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
  // später ergänzbar:
  // { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function DashboardShell({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const router = useRouter();
  const { user, profile, loading } = useCurrentProfile();

  const displayName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      profile.role ||
      user?.email ||
      "Benutzer"
    : user?.email || "Gast";

  const initials = (
    profile?.first_name?.[0] ??
    user?.email?.[0] ??
    "?"
  ).toUpperCase();

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

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-100">
      {/* Sidebar (Desktop + Mobile Slide-in) */}
      {/* Overlay für Mobile */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Sidebar schließen"
        />
      )}

      <aside
        className={`fixed flex flex-col justify-between inset-y-0 left-0 z-40 w-64 transform bg-[#0b0b0b] border-r border-zinc-800 p-4 transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        <div>
          {/* Logo / Brand */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/80">
              <Image
                src="/icons/icon-512.png"
                alt="GHV Logo"
                width={20}
                height={20}
                className="w-full h-full"
              />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                GHV Pilot
              </div>
              <div className="text-[11px] text-zinc-400">
                Internes Dashboard
              </div>
            </div>
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
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors
                  ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-600/40"
                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar (z. B. Version / Settings) */}
        <div className="flex flex-col gap-4 mt-8 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 rounded-xl gap-1 border border-red-500 text-red-400 cursor-pointer hover:bg-red-400/10"
          >
            <LogOut className="h-3 w-3" />
            Abmelden
          </button>
          <div className="flex items-center justify-between">
            <span>v0.1.0</span>
            <Link
              href="/settings"
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              <Settings className="h-3 w-3" />
              Einstellungen
            </Link>
          </div>
        </div>
      </aside>

      {/* Content-Bereich */}
      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-[#050505]/80 px-3 py-2 backdrop-blur md:px-4">
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

            {/* Breadcrumbs unter dem Titel */}
            <Breadcrumbs />
          </div>

          {/* Rechts: User / Status */}
          <div className="flex items-center gap-3">
            {/* Platz für Online/Offline-Badge? → kommt bereits aus ClientProviders */}
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
        </header>

        {/* Hauptinhalt */}
        <main className="flex-1 bg-[#050505] px-3 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
