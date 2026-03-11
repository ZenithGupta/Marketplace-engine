"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types/database";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role check
  if (requiredRole && role) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Go Home
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Convenience wrappers
export function VendorRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRole="vendor">{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRole="super_admin">{children}</ProtectedRoute>;
}
