import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe-server';

const stripe = getServerStripe();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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
      
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Find transaction by payment intent ID
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('stripePaymentIntentId', '==', paymentIntent.id)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);
  
  if (transactionsSnapshot.empty) {
    console.log('No transaction found for payment intent:', paymentIntent.id);
    return;
  }

  const transactionDoc = transactionsSnapshot.docs[0];
  const transactionData = transactionDoc.data();

  // Update transaction
  await updateDoc(transactionDoc.ref, {
    status: 'succeeded',
    updatedAt: new Date()
  });

  // Update claim counters
  const claimRef = doc(db, 'claims', transactionData.claimId);
  await updateDoc(claimRef, {
    totalSuccess: transactionData.totalSuccess + 1,
    updatedAt: new Date()
  });

  // Add to user's payment history
  const userRef = doc(db, 'users', transactionData.userId);
  await updateDoc(userRef, {
    paymentHistory: transactionData.paymentHistory ? 
      [...transactionData.paymentHistory, {
        amount: transactionData.amount,
        date: new Date(),
        status: 'succeeded'
      }] : [{
        amount: transactionData.amount,
        date: new Date(),
        status: 'succeeded'
      }],
    updatedAt: new Date()
  });

  // Log audit
  await addDoc(collection(db, 'audit_logs'), {
    action: 'payment_succeeded',
    actorId: 'system',
    payload: {
      paymentIntentId: paymentIntent.id,
      userId: transactionData.userId,
      amount: transactionData.amount
    },
    createdAt: new Date()
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find transaction by payment intent ID
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('stripePaymentIntentId', '==', paymentIntent.id)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);
  
  if (transactionsSnapshot.empty) {
    console.log('No transaction found for payment intent:', paymentIntent.id);
    return;
  }

  const transactionDoc = transactionsSnapshot.docs[0];
  const transactionData = transactionDoc.data();

  // Update transaction
  await updateDoc(transactionDoc.ref, {
    status: 'failed',
    failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
    updatedAt: new Date()
  });

  // Update claim counters
  const claimRef = doc(db, 'claims', transactionData.claimId);
  await updateDoc(claimRef, {
    totalFailed: transactionData.totalFailed + 1,
    updatedAt: new Date()
  });

  // Log audit
  await addDoc(collection(db, 'audit_logs'), {
    action: 'payment_failed',
    actorId: 'system',
    payload: {
      paymentIntentId: paymentIntent.id,
      userId: transactionData.userId,
      amount: transactionData.amount,
      reason: paymentIntent.last_payment_error?.message
    },
    createdAt: new Date()
  });
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  // Find transaction by payment intent ID
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('stripePaymentIntentId', '==', paymentIntent.id)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);
  
  if (transactionsSnapshot.empty) {
    console.log('No transaction found for payment intent:', paymentIntent.id);
    return;
  }

  const transactionDoc = transactionsSnapshot.docs[0];
  const transactionData = transactionDoc.data();

  // Update transaction
  await updateDoc(transactionDoc.ref, {
    status: 'requires_action',
    failureReason: 'Authentication required',
    updatedAt: new Date()
  });

  // Log audit
  await addDoc(collection(db, 'audit_logs'), {
    action: 'payment_requires_action',
    actorId: 'system',
    payload: {
      paymentIntentId: paymentIntent.id,
      userId: transactionData.userId,
      amount: transactionData.amount
    },
    createdAt: new Date()
  });
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  // Find user by customer ID
  const usersQuery = query(
    collection(db, 'users'),
    where('stripeCustomerId', '==', paymentMethod.customer)
  );
  const usersSnapshot = await getDocs(usersQuery);
  
  if (usersSnapshot.empty) {
    console.log('No user found for customer:', paymentMethod.customer);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await updateDoc(userDoc.ref, {
    defaultPaymentMethodId: paymentMethod.id,
    updatedAt: new Date()
  });
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  // Find user by customer ID
  const usersQuery = query(
    collection(db, 'users'),
    where('stripeCustomerId', '==', paymentMethod.customer)
  );
  const usersSnapshot = await getDocs(usersQuery);
  
  if (usersSnapshot.empty) {
    console.log('No user found for customer:', paymentMethod.customer);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await updateDoc(userDoc.ref, {
    defaultPaymentMethodId: null,
    updatedAt: new Date()
  });
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  // Find transaction by charge ID
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('stripePaymentIntentId', '==', dispute.payment_intent)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);
  
  if (transactionsSnapshot.empty) {
    console.log('No transaction found for dispute:', dispute.id);
    return;
  }

  const transactionDoc = transactionsSnapshot.docs[0];
  const transactionData = transactionDoc.data();

  // Update transaction
  await updateDoc(transactionDoc.ref, {
    status: 'disputed',
    failureReason: `Dispute created: ${dispute.reason}`,
    updatedAt: new Date()
  });

  // Log audit
  await addDoc(collection(db, 'audit_logs'), {
    action: 'dispute_created',
    actorId: 'system',
    payload: {
      disputeId: dispute.id,
      userId: transactionData.userId,
      amount: transactionData.amount,
      reason: dispute.reason
    },
    createdAt: new Date()
  });
}
