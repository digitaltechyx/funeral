'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getStripe } from '@/lib/stripe';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  isDefault: boolean;
}

interface PaymentMethodsProps {
  onPaymentMethodAdded?: () => void;
  onPaymentMethodRemoved?: () => void;
}

export function PaymentMethods({ onPaymentMethodAdded, onPaymentMethodRemoved }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.uid) {
      fetchPaymentMethods();
    }
  }, [userProfile?.uid]);

  const fetchPaymentMethods = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);
      
      // For now, use mock data since we're testing locally
      // In production, this would fetch from Firestore or Stripe
      const mockPaymentMethods: PaymentMethod[] = [];
      
      setPaymentMethods(mockPaymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch payment methods',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setLoading(true);
      
      // For now, create a mock payment method since we're testing locally
      // In production, this would integrate with Stripe Elements
      const mockPaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        isDefault: paymentMethods.length === 0, // First payment method is default
      };

      // Add to local state
      setPaymentMethods(prev => [...prev, mockPaymentMethod]);

      // Update user status to Active
      if (userProfile) {
        await fetch('/api/members/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            memberId: userProfile.uid,
            status: 'Active',
            hasPaymentMethod: true
          }),
        });
      }

      toast({
        title: 'Success',
        description: 'Payment method added successfully! You are now an Active Member.',
      });

      onPaymentMethodAdded?.();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add payment method',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      
      // Remove from local state
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));

      // If no payment methods left, update user status to Inactive
      if (paymentMethods.length === 1 && userProfile) {
        await fetch('/api/members/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            memberId: userProfile.uid,
            status: 'Inactive',
            hasPaymentMethod: false
          }),
        });
      }

      toast({
        title: 'Success',
        description: 'Payment method removed successfully',
      });

      onPaymentMethodRemoved?.();
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove payment method',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your payment methods to become an active member
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Add a payment method to become an active member and participate in funeral assistance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Development Mode:</strong>
                    </p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will add a mock payment method for testing. In production, this would integrate with Stripe Elements for secure card collection.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Active Member Benefits:</strong>
                    </p>
                  </div>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Participate in funeral assistance program</li>
                    <li>• Receive up to $8,000 in funeral assistance</li>
                    <li>• Contribute to community support</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleAddPaymentMethod} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Add Mock Payment Method'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading payment methods...</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a payment method to become an active member and participate in funeral assistance.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getCardIcon(method.card.brand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {method.card.brand.toUpperCase()} •••• {method.card.last4}
                      </p>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {formatExpiryDate(method.card.exp_month, method.card.exp_year)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePaymentMethod(method.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>You are an Active Member!</strong> You can now participate in funeral assistance.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






