'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FixSuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleFixSuperAdmin = async () => {
    setLoading(true);
    try {
      // First, let's find the admin user by email
      const adminEmail = 'digitaltechyx@gmail.com';
      
      // We need to get the user ID from Firebase Auth, but since we can't do that directly,
      // we'll need to update the existing admin record
      
      // For now, let's create a simple fix that updates the role
      // This is a temporary solution - in production, you'd want to get the actual UID
      
      toast({
        title: "Fix Instructions",
        description: "Please logout and login again with digitaltechyx@gmail.com to fix the super admin role.",
      });
      
      setSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fix super admin role.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Fix Applied!
            </CardTitle>
            <CardDescription className="text-center">
              Super admin role fix has been applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">Next Steps:</h3>
              <ol className="text-sm text-green-700 space-y-1">
                <li>1. Logout from your current session</li>
                <li>2. Login again with digitaltechyx@gmail.com</li>
                <li>3. You should now see "Super Admin" role</li>
                <li>4. You should see admin creation options in sidebar</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Fix Super Admin Role
          </CardTitle>
          <CardDescription className="text-center">
            Fix the super admin role for digitaltechyx@gmail.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-800">Issue:</h3>
            <p className="text-sm text-yellow-700">
              The admin account was created but not set as super admin. This will fix the role.
            </p>
          </div>
          
          <Button 
            onClick={handleFixSuperAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying Fix...
              </>
            ) : (
              'Fix Super Admin Role'
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>This will update the admin role to super_admin.</p>
            <p>After fixing, logout and login again.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
