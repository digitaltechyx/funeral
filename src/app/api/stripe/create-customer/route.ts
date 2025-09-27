import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

    // If user already has a Stripe customer ID, return it
    if (userData.stripeCustomerId) {
      return NextResponse.json({ 
        success: true, 
        customerId: userData.stripeCustomerId 
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.name,
      metadata: {
        userId: userId
      }
    });

    // Update user document with Stripe customer ID
    await updateDoc(userRef, {
      stripeCustomerId: customer.id,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      customerId: customer.id 
    });

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
