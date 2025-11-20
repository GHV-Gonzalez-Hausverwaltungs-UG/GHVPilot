"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

// Map für “schöne” Labels pro Route
const LABELS: Record<string, string> = {
  "/": "Besichtigungen",
  "/besichtigung/neue": "Neue Besichtigung",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Querystring weg, in Segmente splitten
  const segments = pathname.split("?")[0].split("/").filter(Boolean);

  if (segments.length === 0) {
    // Auf der Startseite kannst du Breadcrumbs auch weglassen
    return null;
  }

  const items = segments.map((seg, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    const isUUID = /^[0-9a-fA-F-]{36}$/.test(seg);

    const label =
      LABELS[href] ??
      (isUUID ? "Details" : decodeURIComponent(seg).replace(/-/g, " "));

    return { href, label, isLast };
  });

  return (
    <nav
      className="hidden items-center gap-1 text-xs text-zinc-400 sm:flex"
      aria-label="Breadcrumb"
    >
      <Link href="/" className="hover:text-zinc-100">
        Start
      </Link>

      {items.map((item) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="h-3 w-3" />
          {item.isLast ? (
            <span className="text-zinc-200 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-zinc-100">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
