'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Users, Trash2, ArrowLeft, Crown, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { canRemoveAdmins, isSuperAdmin } from '@/lib/permissions';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: any;
  createdBy?: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const canRemove = canRemoveAdmins(userProfile);
  const isSuper = isSuperAdmin(userProfile);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const adminsSnapshot = await getDocs(collection(db, 'admin_users'));
      const adminsList: AdminUser[] = [];
      
      adminsSnapshot.forEach((doc) => {
        adminsList.push({
          id: doc.id,
          ...doc.data()
        } as AdminUser);
      });
      
      // Sort by role (super_admin first) then by name
      adminsList.sort((a, b) => {
        if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
        if (b.role === 'super_admin' && a.role !== 'super_admin') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin list.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!canRemove) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to remove admins.",
      });
      return;
    }

    if (adminId === userProfile?.uid) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Self",
        description: "You cannot delete your own admin account.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove ${adminName} as an admin? This action cannot be undone.`)) {
      return;
    }

    setDeleting(adminId);
    try {
      // Delete from admin_users collection
      await deleteDoc(doc(db, 'admin_users', adminId));
      
      // Update role in members collection to 'member'
      // Note: In a real app, you might want to keep the admin record for audit purposes
      // and just change the role instead of deleting
      
      toast({
        title: "Admin Removed",
        description: `${adminName} has been removed as an admin.`,
      });
      
      // Reload the list
      await loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove admin.",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!isSuper) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center text-red-600">
                Access Denied
              </CardTitle>
              <CardDescription className="text-center">
                Only Super Admins can manage admin accounts.
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

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-headline">Manage Admins</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Admin Accounts
            </CardTitle>
            <CardDescription>
              Manage admin accounts and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading admins...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div 
                    key={admin.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {admin.role === 'super_admin' ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Shield className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <h3 className="font-semibold">{admin.name}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {admin.role === 'super_admin' && (
                        <Badge variant="outline" className="text-xs">
                          Cannot Remove
                        </Badge>
                      )}
                      {admin.role === 'admin' && canRemove && admin.id !== userProfile?.uid && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                          disabled={deleting === admin.id}
                        >
                          {deleting === admin.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {admins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No admin accounts found.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
