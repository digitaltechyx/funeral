'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Edit3, 
  Save, 
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AccountPage() {
  const { user, userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (userProfile?.status === 'Active') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active Member</Badge>;
    }
    return <Badge variant="secondary">Inactive Member</Badge>;
  };

  const getRoleBadge = () => {
    if (userProfile?.role === 'super_admin') {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
    } else if (userProfile?.role === 'admin') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
    }
    return <Badge variant="outline">Member</Badge>;
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile, payment methods, and account settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {getRoleBadge()}
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {userProfile?.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={isLoading}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Status</span>
                    {getStatusBadge()}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sadqa Wallet</span>
                    <span className="text-sm font-medium">
                      ${userProfile?.sadqaWallet?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment methods for community contributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add a payment method to participate in community funeral contributions.
                    When a funeral claim is approved, all active members will be charged $8 per person (including dependents).
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/account/payment">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Payment Methods
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Member Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Active Member Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Participate in Funeral Assistance</p>
                      <p className="text-sm text-muted-foreground">
                        Contribute to community funerals and receive assistance when needed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Transparent Financial Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        View all community financial activities and reports
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Priority Support</p>
                      <p className="text-sm text-muted-foreground">
                        Get priority assistance and support from the community
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}