import { NextRequest, NextResponse } from 'next/server';
import { getCustomerPaymentMethods } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // For now, return empty array since we're not storing payment methods in Stripe customers
    // We'll store payment method tokens directly in Firestore
    return NextResponse.json({
      paymentMethods: [],
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}






