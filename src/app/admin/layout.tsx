'use client';

import { Header } from "@/components/app/header";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BarChart3, Handshake, Landmark, LayoutDashboard, ListFilter, Phone, Settings, ShieldCheck, Users, UserPlus, Users2, UserCog } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateAdmins, isSuperAdmin } from "@/lib/permissions";

function AdminSidebar() {
  const { userProfile } = useAuth();
  const canCreate = canCreateAdmins(userProfile);
  const isSuper = isSuperAdmin(userProfile);

  return (
    <Sidebar side="left" collapsible="offcanvas" className="border-r">
      <SidebarHeader className="p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                  <Handshake className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg font-headline">FuneralShare</span>
          </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/members">
                <Users />
                Members
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {canCreate && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/create-admin">
                    <UserPlus />
                    Create Admin
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/bulk-create-admins">
                    <Users2 />
                    Bulk Create Admins
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          {isSuper && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin/manage-admins">
                  <UserCog />
                  Manage Admins
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/claims">
                <ShieldCheck />
                Claims
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/emergency-contacts">
                <Phone />
                Emergency Contacts
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/funerals">
                <ListFilter />
                Funerals
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/payments">
                <Landmark />
                Payments
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/reports">
                <BarChart3 />
                Reports
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
         <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/settings">
                <Settings />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          {/* Header will be part of the page content */}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
