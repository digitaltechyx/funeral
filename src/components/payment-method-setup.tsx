'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { updateUserPaymentMethodStatus } from '@/lib/user-actions';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethodSetupProps {
  onSuccess?: () => void;
}

function PaymentMethodForm({ onSuccess }: PaymentMethodSetupProps) {
  const { user, refreshUserProfile } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create setup intent
      const response = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: user.uid,
        }),
      });

      const { clientSecret, customerId: apiCustomerId } = await response.json();

      if (!clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      // Confirm setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user.displayName || user.email || 'Member',
            email: user.email || '',
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Failed to add payment method');
      } else {
        console.log('Stripe setup succeeded, updating user payment method status...');
        console.log('Setup intent:', setupIntent);
        
        // Get the customer ID and payment method ID from the setup intent
        const stripeCustomerId = setupIntent?.customer as string || apiCustomerId;
        const stripePaymentMethodId = setupIntent?.payment_method as string;
        
        console.log('Stripe Customer ID:', stripeCustomerId);
        console.log('Stripe Payment Method ID:', stripePaymentMethodId);
        
        // Update user's payment method status in Firestore with Stripe IDs
        const updateResult = await updateUserPaymentMethodStatus(
          user.uid, 
          true, 
          stripeCustomerId, 
          stripePaymentMethodId
        );
        
        if (updateResult.success) {
          // Refresh user profile to get updated payment method status
          await refreshUserProfile();
          
          toast({
            title: "Payment Method Added",
            description: "Your payment method has been successfully added.",
          });
          onSuccess?.();
        } else {
          toast({
            variant: "destructive",
            title: "Payment Method Added",
            description: "Payment method added but status update failed. Please refresh the page.",
          });
          onSuccess?.();
        }
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Details</label>
        <div className="p-3 border rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding Payment Method...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </>
        )}
      </Button>
    </form>
  );
}

export function PaymentMethodSetup({ onSuccess }: PaymentMethodSetupProps) {
  const { userProfile } = useAuth();
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setHasPaymentMethod(userProfile.hasPaymentMethod || false);
      setLoading(false);
    }
  }, [userProfile]);

  const handleSuccess = () => {
    setHasPaymentMethod(true);
    onSuccess?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasPaymentMethod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Payment Method Added
          </CardTitle>
          <CardDescription>
            You have successfully added a payment method. You are now eligible for memorial share charges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Payment method is active and ready for charges</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Add Payment Method
        </CardTitle>
        <CardDescription>
          Add a payment method to become eligible for memorial share charges. This is required to participate in the community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <PaymentMethodForm onSuccess={handleSuccess} />
        </Elements>
      </CardContent>
    </Card>
  );
}
