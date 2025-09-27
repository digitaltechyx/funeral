import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe-server';

const stripe = getServerStripe();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Ensure user has a Stripe customer ID
    let customerId = userData.stripeCustomerId;
    
    if (!customerId) {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: userId
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
      clientSecret: setupIntent.client_secret 
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
