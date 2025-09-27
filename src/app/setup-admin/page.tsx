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

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSetupAdmin = async () => {
    setLoading(true);
    try {
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'digitaltechyx@gmail.com', 
        '225588Zz@'
      );
      
      // Update display name
      await updateProfile(userCredential.user, { 
        displayName: 'Admin User' 
      });
      
      // Create super admin profile in members collection
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: 'digitaltechyx@gmail.com',
        name: 'Super Admin',
        phone: '',
        role: 'super_admin', // Set as super_admin
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create super admin profile in admin_users collection
      await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
        email: 'digitaltechyx@gmail.com',
        name: 'Super Admin',
        role: 'super_admin', // Set as super_admin
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
      });
      
      setSuccess(true);
      toast({
        title: "Admin Account Created",
        description: "Admin account has been created successfully!",
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setSuccess(true);
        toast({
          title: "Admin Account Exists",
          description: "Admin account already exists. You can now login with the credentials.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create admin account.",
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
              Admin Ready!
            </CardTitle>
            <CardDescription className="text-center">
              Admin account is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">Admin Credentials:</h3>
              <p className="text-sm text-green-700"><strong>Email:</strong> digitaltechyx@gmail.com</p>
              <p className="text-sm text-green-700"><strong>Password:</strong> 225588Zz@</p>
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
            Admin Setup
          </CardTitle>
          <CardDescription className="text-center">
            Create the admin account for Memorial Share Community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Admin Credentials:</h3>
            <p className="text-sm"><strong>Email:</strong> digitaltechyx@gmail.com</p>
            <p className="text-sm"><strong>Password:</strong> 225588Zz@</p>
          </div>
          
          <Button 
            onClick={handleSetupAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin Account...
              </>
            ) : (
              'Create Admin Account'
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>This will create the admin account in Firebase.</p>
            <p>After creation, you can login with the credentials above.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
