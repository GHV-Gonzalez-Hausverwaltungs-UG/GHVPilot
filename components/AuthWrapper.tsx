// components/AuthWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import DashboardShell from "./layout/DashboardShell";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) return <>{children}</>;
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
