'use client';

import { UserNav } from "@/components/app/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

type HeaderProps = {
    title: string;
}

export function Header({ title }: HeaderProps) {
  const { userProfile } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <div className="flex items-center gap-2 md:hidden">
         <SidebarTrigger />
       </div>
      <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">{title}</h1>
      <div className="flex items-center gap-4">
        {userProfile && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Welcome, {userProfile.name}</span>
                   <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                     {userProfile.role === 'super_admin' ? 'Super Admin' : 
                      userProfile.role === 'admin' ? 'Admin' : 'Member'}
                   </span>
          </div>
        )}
        <UserNav />
      </div>
    </header>
  );
}
