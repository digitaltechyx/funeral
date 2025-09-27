'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertCircle, Trash2, UserCheck } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: any;
  updatedAt: any;
}

export default function ManageAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminsSnapshot = await getDocs(collection(db, 'admin_users'));
      const adminsData = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Admins",
        description: "Failed to load admin users.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(adminId);
      
      // Delete from admin_users collection
      await deleteDoc(doc(db, 'admin_users', adminId));
      
      // Update role in members collection to 'member'
      await updateDoc(doc(db, 'members', adminId), {
        role: 'member',
        updatedAt: new Date()
      });
      
      // Remove from local state
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      toast({
        title: "Admin Removed",
        description: `Admin "${adminName}" has been removed successfully.`,
      });
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        variant: "destructive",
        title: "Error Removing Admin",
        description: "Failed to remove admin user.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Manage Admins" />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Manage Admins" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Admin Users
              </CardTitle>
              <CardDescription>
                Manage admin accounts and their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Admin Users Found</h3>
                  <p className="text-muted-foreground">
                    No admin users have been created yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Removing an admin will downgrade them to a regular member. 
                      This action cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(admin.role)}>
                              {admin.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions?.slice(0, 3).map((permission, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                              {admin.permissions?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{admin.permissions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(admin.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              disabled={deletingId === admin.id || admin.role === 'super_admin'}
                            >
                              {deletingId === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
