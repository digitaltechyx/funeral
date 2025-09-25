'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SimpleSetupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    try {
      console.log('Starting super admin creation...');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'digitaltechyx@gmail.com', 
        '225588Zz@'
      );
      
      console.log('Auth user created:', userCredential.user.uid);
      
      // Update display name
      await updateProfile(userCredential.user, { 
        displayName: 'Super Admin' 
      });
      
      console.log('Display name updated');
      
      // Create super admin profile in members collection
      const memberData = {
        uid: userCredential.user.uid,
        email: 'digitaltechyx@gmail.com',
        name: 'Super Admin',
        phone: '',
        role: 'super_admin',
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Creating members document...');
      await setDoc(doc(db, 'members', userCredential.user.uid), memberData);
      console.log('Members document created');
      
      // Create super admin profile in admin_users collection
      const adminData = {
        email: 'digitaltechyx@gmail.com',
        name: 'Super Admin',
        role: 'super_admin',
        permissions: [
          'read_claims', 
          'approve_claims', 
          'charge_members', 
          'view_reports',
          'create_admins',
          'remove_admins',
          'manage_system'
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Creating admin_users document...');
      await setDoc(doc(db, 'admin_users', userCredential.user.uid), adminData);
      console.log('Admin_users document created');
      
      setSuccess(true);
      toast({
        title: "Super Admin Created Successfully!",
        description: "Super admin account has been created. You can now login.",
      });
      
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setSuccess(true);
        toast({
          title: "Super Admin Already Exists",
          description: "Super admin account already exists. You can now login with the credentials.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to create super admin: ${error.message}`,
        });
      }
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
              Super Admin Ready!
            </CardTitle>
            <CardDescription className="text-center">
              Super admin account is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">Login Credentials:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Email:</strong> digitaltechyx@gmail.com</p>
                <p><strong>Password:</strong> 225588Zz@</p>
                <p><strong>Role:</strong> Super Admin</p>
              </div>
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
            Simple Super Admin Setup
          </CardTitle>
          <CardDescription className="text-center">
            Create super admin account (Firebase Test Mode)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">Firebase Test Mode</h3>
            <p className="text-sm text-blue-700">
              Since Firebase is in test mode, this should work without permission issues.
            </p>
          </div>
          
          <Button 
            onClick={handleCreateSuperAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Super Admin...
              </>
            ) : (
              'Create Super Admin Account'
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>This will create the super admin account with full permissions.</p>
            <p>Check browser console for detailed logs.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
