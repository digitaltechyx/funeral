'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'member' | 'admin' | 'super_admin';
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        // Allow super_admin to access admin routes
        if (requiredRole === 'admin' && userProfile?.role === 'super_admin') {
          // Super admin can access admin routes, don't redirect
        } else {
          // Redirect to appropriate dashboard based on user role
          if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
          return;
        }
      }
    }
  }, [user, userProfile, loading, requiredRole, fallbackPath, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    // Allow super_admin to access admin routes
    if (requiredRole === 'admin' && userProfile?.role === 'super_admin') {
      // Super admin can access admin routes, continue rendering
    } else {
      return null; // Will redirect to appropriate dashboard
    }
  }

  return <>{children}</>;
}
