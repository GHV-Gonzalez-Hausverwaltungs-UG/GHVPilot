// components/AuthWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import AuthGate from "@/components/AuthGate";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) return <>{children}</>;
  return <AuthGate>{children}</AuthGate>;
}
