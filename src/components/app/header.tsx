'use client';

import { UserNav } from "@/components/app/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

type HeaderProps = {
    title: string;
    children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const { userProfile } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <div className="flex items-center gap-2">
         <SidebarTrigger />
       </div>
      <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
        {userProfile && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Welcome, {userProfile.name}</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              {userProfile.role === 'super_admin' ? 'Super Admin' : 
               userProfile.role === 'admin' ? 'Admin' : 'Member'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              userProfile.hasPaymentMethod 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {userProfile.hasPaymentMethod ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
        <UserNav />
      </div>
    </header>
  );
}
