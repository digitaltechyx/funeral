import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { paymentMethodId } = await req.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const stripe = getServerStripe();
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}






