import { type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { TopBar } from "./TopBar";
import { useCurrentUser } from "@/domains/auth";
import { UserRole } from "@/common/enums/user-role.enum";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="flex min-h-screen w-full">
      {isAdmin ? <AdminSidebar /> : <AppSidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
