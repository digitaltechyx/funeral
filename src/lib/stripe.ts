import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe on the server (only use in API routes)
export const getServerStripe = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerStripe should only be called on the server');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
};

// Initialize Stripe on the client
export const getStripe = () => {
  if (typeof window === 'undefined') {
    throw new Error('getStripe should only be called on the client');
  }
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Create a Stripe customer for a member
export async function createStripeCustomer(memberData: {
  email: string;
  name: string;
  phone: string;
  memberId: string;
}) {
  try {
    const stripe = getServerStripe();
    const customer = await stripe.customers.create({
      email: memberData.email,
      name: memberData.name,
      phone: memberData.phone,
      metadata: {
        memberId: memberData.memberId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create a payment intent for memorial share
export async function createPaymentIntent(
  amount: number,
  memberId: string,
  customerId: string,
  paymentMethodId?: string
) {
  try {
    const stripe = getServerStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        memberId: memberId,
        type: 'memorial_share',
      },
      description: 'Memorial Share Community - Memorial Assistance Payment',
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Create a setup intent for saving payment methods
export async function createSetupIntent(customerId: string, memberId: string) {
  try {
    const stripe = getServerStripe();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        memberId: memberId,
      },
    });

    return setupIntent;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const stripe = getServerStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

// Create an invoice for a member
export async function createInvoice(
  customerId: string,
  amount: number,
  memberId: string,
  description: string
) {
  try {
    const stripe = getServerStripe();
    
    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: description,
      metadata: {
        memberId: memberId,
      },
    });

    // Create and finalize invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      metadata: {
        memberId: memberId,
      },
    });

    await stripe.invoices.finalizeInvoice(invoice.id);

    return invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

// Charge all active members for a funeral
export async function chargeActiveMembers(
  activeMembers: Array<{
    id: string;
    stripeCustomerId: string;
    paymentMethodId: string;
  }>,
  amountPerMember: number,
  funeralId: string
) {
  const results = [];

  for (const member of activeMembers) {
    try {
      const paymentIntent = await createPaymentIntent(
        amountPerMember,
        member.id,
        member.stripeCustomerId,
        member.paymentMethodId
      );

      results.push({
        memberId: member.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        success: paymentIntent.status === 'succeeded',
      });
    } catch (error) {
      console.error(`Error charging member ${member.id}:`, error);
      results.push({
        memberId: member.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }

  return results;
}






