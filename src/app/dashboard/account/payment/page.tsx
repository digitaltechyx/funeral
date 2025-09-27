'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateUserPaymentMethodStatus } from '@/lib/user-actions';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentMethodForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  useEffect(() => {
    if (userProfile?.hasPaymentMethod) {
      setHasPaymentMethod(true);
    }
  }, [userProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);

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

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      // Confirm setup intent
      const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user.displayName || '',
            email: user.email || '',
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to add payment method');
      } else {
        // Update user's payment method status in Firestore
        const updateResult = await updateUserPaymentMethodStatus(user.uid, true);
        
        if (updateResult.success) {
          // Refresh user profile to get updated payment method status
          await refreshUserProfile();
          
          toast({
            title: "Payment Method Added",
            description: "Your payment method has been successfully added.",
          });
          setHasPaymentMethod(true);
        } else {
          toast({
            variant: "destructive",
            title: "Payment Method Added",
            description: "Payment method added but status update failed. Please refresh the page.",
          });
          setHasPaymentMethod(true);
        }
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add payment method',
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasPaymentMethod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Method Added
          </CardTitle>
          <CardDescription>
            Your payment method is set up and ready for community contributions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your card will be automatically charged when the community needs to contribute to memorial expenses.
          </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Add Payment Method
        </CardTitle>
        <CardDescription>
          Add a payment method to participate in community memorial contributions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to add a payment method to participate in community contributions.
              When a memorial claim is approved, all active members will be charged $8 per person (including dependents).
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-md">
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
            <Button 
              type="submit" 
              disabled={!stripe || loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Payment Method...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage your payment methods for community contributions
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentMethodForm />
        </Elements>
      </div>
    </div>
  );
}
