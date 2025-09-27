import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe-server';

const stripe = getServerStripe();

export async function POST(request: NextRequest) {
  try {
    const { userId, memberId } = await request.json();
    const actualUserId = userId || memberId;

    if (!actualUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Setup intent request:', { userId, memberId, actualUserId });

    // Get user profile from Firestore
    const userRef = doc(db, 'users', actualUserId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User not found in Firestore, creating basic profile for:', actualUserId);
      // Create a basic user profile if it doesn't exist
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userRef, {
        id: actualUserId,
        name: 'User',
        email: 'user@example.com',
        phone: '',
        stripeCustomerId: null,
        hasPaymentMethod: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const userData = userDoc.exists() ? userDoc.data() : {
      name: 'User',
      email: 'user@example.com',
      stripeCustomerId: null
    };

    // Ensure user has a Stripe customer ID
    let customerId = userData.stripeCustomerId;
    
    if (!customerId) {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: actualUserId
        }
      });
      
      customerId = customer.id;
      
      // Update user document with Stripe customer ID
      await updateDoc(userRef, {
        stripeCustomerId: customerId,
        updatedAt: new Date()
      });
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    return NextResponse.json({ 
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
