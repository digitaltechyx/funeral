'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2, ShieldCheck, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateAdmins } from '@/lib/permissions';

const adminSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().optional(),
});

type AdminFormInputs = z.infer<typeof adminSchema>;

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  // Check if user can create admins
  if (!canCreateAdmins(userProfile)) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center text-red-600">
                Access Denied
              </CardTitle>
              <CardDescription className="text-center">
                You don't have permission to create admin accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/admin/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminFormInputs>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmit = async (data: AdminFormInputs) => {
    setLoading(true);
    try {
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      // Update display name
      await updateProfile(userCredential.user, { 
        displayName: data.name 
      });
      
      // Create admin profile in members collection
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        role: 'admin', // Regular admin, not super_admin
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create admin profile in admin_users collection
      await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
        email: data.email,
        name: data.name,
        role: 'admin', // Regular admin, not super_admin
        permissions: ['read_claims', 'approve_claims', 'charge_members', 'view_reports'],
        createdBy: userProfile?.uid, // Track who created this admin
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setSuccess(true);
      reset();
      toast({
        title: "Admin Created Successfully",
        description: `${data.name} has been added as an admin.`,
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Email Already Exists",
          description: "An account with this email already exists.",
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
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center flex items-center justify-center gap-2">
                <ShieldCheck className="h-6 w-6 text-green-500" />
                Admin Created Successfully!
              </CardTitle>
              <CardDescription className="text-center">
                The new admin account has been created and is ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 text-green-800">Next Steps:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• The new admin can now login with their credentials</li>
                  <li>• They will have full admin access to the system</li>
                  <li>• You can create more admins using this page</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSuccess(false)}
                  className="flex-1"
                >
                  Create Another Admin
                </Button>
                <Link href="/admin/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-headline">Create New Admin</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Admin User
            </CardTitle>
            <CardDescription>
              Create a new admin account with full system access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name")}
                  disabled={loading}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register("phone")}
                  disabled={loading}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register("password")}
                  disabled={loading}
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">Admin Permissions:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Read and manage claims</li>
                  <li>• Approve or reject claims</li>
                  <li>• Charge members for funerals</li>
                  <li>• View reports and analytics</li>
                  <li>• Manage member accounts</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
