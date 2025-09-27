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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentMethodForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  useEffect(() => {
    if (userProfile?.defaultPaymentMethodId) {
      setHasPaymentMethod(true);
    }
  }, [userProfile]);

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.uid }),
      });

      const data = await response.json();
      
      if (data.success) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.error || 'Failed to create setup intent');
      }
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create setup intent. Please try again.',
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.status === 'succeeded') {
        // Attach payment method to customer
        const attachResponse = await fetch('/api/stripe/attach-payment-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.uid,
            paymentMethodId: setupIntent.payment_method
          }),
        });

        const attachData = await attachResponse.json();

        if (attachData.success) {
          setHasPaymentMethod(true);
          setClientSecret(null);
          toast({
            title: 'Success',
            description: 'Card added successfully. Your card will be used for future charges.',
          });
        } else {
          throw new Error(attachData.error || 'Failed to attach payment method');
        }
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment method. Please try again.',
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
              Your card will be automatically charged when the community needs to contribute to funeral expenses.
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
          Add a payment method to participate in community funeral contributions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!clientSecret ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to add a payment method to participate in community contributions.
                When a funeral claim is approved, all active members will be charged $8 per person (including dependents).
              </AlertDescription>
            </Alert>
            <Button onClick={createSetupIntent} className="w-full">
              Add Payment Method
            </Button>
          </div>
        ) : (
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
        )}
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
