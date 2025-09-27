'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function CreateAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Update display name
      await updateProfile(userCredential.user, { 
        displayName: formData.name 
      });
      
      // Create admin profile in members collection
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        phone: formData.phone || '',
        role: 'admin',
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create admin profile in admin_users collection
      await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
        email: formData.email,
        name: formData.name,
        role: 'admin',
        permissions: ['read_claims', 'approve_claims', 'charge_members', 'view_reports'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setSuccess(true);
      toast({
        title: "Admin Created Successfully",
        description: `Admin account for ${formData.name} has been created successfully!`,
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: ''
      });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        variant: "destructive",
        title: "Error Creating Admin",
        description: error.message || "Failed to create admin account.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Create Admin" />
        <main className="flex-1 p-4 md:p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Created Successfully!</h2>
              <p className="text-muted-foreground mb-4">
                The admin account has been created and is ready to use.
              </p>
              <Button onClick={() => setSuccess(false)}>
                Create Another Admin
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Create Admin" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Create New Admin
              </CardTitle>
              <CardDescription>
                Create a new admin account with appropriate permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter secure password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The new admin will have permissions to read claims, approve claims, charge members, and view reports.
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
