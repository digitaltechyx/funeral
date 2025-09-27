import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getServerStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Update member's payment status in Firestore
  if (paymentIntent.metadata?.memberId) {
    const memberRef = doc(db, 'members', paymentIntent.metadata.memberId);
    await updateDoc(memberRef, {
      hasPaymentMethod: true,
      status: 'Active',
      updatedAt: new Date(),
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  // Log failed payment for admin review
  if (paymentIntent.metadata?.memberId) {
    const memberRef = doc(db, 'members', paymentIntent.metadata.memberId);
    await updateDoc(memberRef, {
      lastPaymentAttempt: new Date(),
      lastPaymentStatus: 'failed',
      updatedAt: new Date(),
    });
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', paymentMethod.id);
  
  // Update member's payment method status
  if (paymentMethod.metadata?.memberId) {
    const memberRef = doc(db, 'members', paymentMethod.metadata.memberId);
    await updateDoc(memberRef, {
      hasPaymentMethod: true,
      stripePaymentMethodId: paymentMethod.id,
      updatedAt: new Date(),
    });
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  
  // Update member's Stripe customer info
  if (customer.metadata?.memberId) {
    const memberRef = doc(db, 'members', customer.metadata.memberId);
    await updateDoc(memberRef, {
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // Generate and send invoice to member
  if (invoice.metadata?.memberId) {
    // Create invoice record in Firestore
    const invoiceRef = doc(db, 'invoices', invoice.id);
    await updateDoc(invoiceRef, {
      status: 'paid',
      paidAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update member's payment history
    const memberRef = doc(db, 'members', invoice.metadata.memberId);
    const memberDoc = await getDoc(memberRef);
    if (memberDoc.exists()) {
      const memberData = memberDoc.data();
      const newPayment = {
        id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        date: new Date(),
        type: 'funeral_share',
        status: 'completed',
        invoiceUrl: invoice.invoice_pdf,
      };
      
      await updateDoc(memberRef, {
        paymentHistory: [...(memberData.paymentHistory || []), newPayment],
        updatedAt: new Date(),
      });
    }
  }
}






