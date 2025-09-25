'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Shield, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DebugRolePage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Not Logged In</CardTitle>
            <CardDescription className="text-center">
              Please login to view your role information.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      default: return role;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Role Debug Information
            </CardTitle>
            <CardDescription>
              Current user authentication and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Firebase Auth User */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Firebase Auth User
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>UID:</strong> {user.uid}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* User Profile */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                User Profile (from Firestore)
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>UID:</strong> {userProfile.uid}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Name:</strong> {userProfile.name}</p>
                <p><strong>Phone:</strong> {userProfile.phone || 'Not set'}</p>
                <p><strong>Status:</strong> {userProfile.status}</p>
                <p><strong>Wallet Balance:</strong> ${userProfile.walletBalance}</p>
                <p><strong>Join Date:</strong> {new Date(userProfile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role Information
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Role:</span>
                  <Badge className={getRoleColor(userProfile.role)}>
                    {getRoleDisplayName(userProfile.role)}
                  </Badge>
                </div>
                
                <div className="text-sm space-y-1">
                  <p><strong>Raw Role Value:</strong> "{userProfile.role}"</p>
                  <p><strong>Is Super Admin:</strong> {userProfile.role === 'super_admin' ? 'Yes' : 'No'}</p>
                  <p><strong>Is Admin:</strong> {(userProfile.role === 'admin' || userProfile.role === 'super_admin') ? 'Yes' : 'No'}</p>
                  <p><strong>Is Member:</strong> {userProfile.role === 'member' ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Expected Redirects */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expected Redirects
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>Should redirect to:</strong> {
                  userProfile.role === 'super_admin' || userProfile.role === 'admin' 
                    ? '/admin/dashboard' 
                    : '/dashboard'
                }</p>
                <p><strong>Can create admins:</strong> {userProfile.role === 'super_admin' ? 'Yes' : 'No'}</p>
                <p><strong>Can manage admins:</strong> {userProfile.role === 'super_admin' ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Link href="/dashboard">
                <Button variant="outline">Go to Member Dashboard</Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button variant="outline">Go to Admin Dashboard</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Back to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
