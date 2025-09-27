import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe-server';

const stripe = getServerStripe();

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ 
        error: 'User ID and Payment Method ID are required' 
      }, { status: 400 });
    }

    // Get user profile from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'User does not have a Stripe customer ID' 
      }, { status: 400 });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userData.stripeCustomerId
    });

    // Set as default payment method
    await stripe.customers.update(userData.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Update user document with default payment method ID
    await updateDoc(userRef, {
      defaultPaymentMethodId: paymentMethodId,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Payment method attached successfully' 
    });

  } catch (error) {
    console.error('Error attaching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    );
  }
}
