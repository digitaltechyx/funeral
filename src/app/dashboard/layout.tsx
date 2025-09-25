import { Header } from "@/components/app/header";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Handshake, HeartHandshake, Home, Landmark, Phone, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="member">
      <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas" className="border-r">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2">
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
                <Link href="/dashboard">
                  <Home />
                  Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/account">
                  <User />
                  My Account
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/dependents">
                  <HeartHandshake />
                  Dependents
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/payment-history">
                  <Landmark />
                  Payment History
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/claims">
                  <ShieldCheck />
                  Claims
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/emergency-contacts">
                  <Phone />
                  Emergency Contacts
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            {/* Can add elements to footer here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
    </ProtectedRoute>
  );
}
