import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { getServerStripe } from '@/lib/stripe-server';

const stripe = getServerStripe();
const BASE_AMOUNT = 8; // USD per person

export async function POST(request: NextRequest) {
  try {
    const { claimId, note } = await request.json();

    // Generate claim ID if not provided
    const finalClaimId = claimId || `claim_${Date.now()}`;

    // Create claim document
    const claimRef = doc(db, 'claims', finalClaimId);
    await updateDoc(claimRef, {
      createdByAdminId: 'admin', // TODO: Get from auth context
      createdAt: new Date(),
      totalMembersAttempted: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalAmountExpected: 0,
      currency: 'usd',
      status: 'processing',
      note: note || ''
    });

    // Get all active users
    const usersQuery = query(collection(db, 'users'), where('status', '==', 'active'));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const results = {
      succeeded: [],
      failed: [],
      requiresAction: [],
      skipped: []
    };

    let totalAmountExpected = 0;

    // Process users in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        const dependents = user.dependents || 0;
        const amount = BASE_AMOUNT * (1 + dependents);
        const amountCents = Math.round(amount * 100);
        
        totalAmountExpected += amount;

        // Check if user has payment method
        if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
          results.skipped.push({
            userId: user.id,
            name: user.name,
            email: user.email,
            reason: 'No payment method'
          });
          return;
        }

        // Create transaction record
        const transactionRef = await addDoc(collection(db, 'transactions'), {
          claimId: finalClaimId,
          userId: user.id,
          dependents: dependents,
          amount: amount,
          amountCents: amountCents,
          currency: 'usd',
          status: 'pending',
          attempts: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        try {
          // Create payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            customer: user.stripeCustomerId,
            payment_method: user.defaultPaymentMethodId,
            off_session: true,
            confirm: true,
            idempotency_key: `charge-${finalClaimId}-${user.id}`
          });

          if (paymentIntent.status === 'succeeded') {
            // Update transaction
            await updateDoc(transactionRef, {
              stripePaymentIntentId: paymentIntent.id,
              status: 'succeeded',
              updatedAt: new Date()
            });

            results.succeeded.push({
              userId: user.id,
              name: user.name,
              email: user.email,
              amount: amount,
              dependents: dependents
            });
          } else if (paymentIntent.status === 'requires_action') {
            // Update transaction
            await updateDoc(transactionRef, {
              stripePaymentIntentId: paymentIntent.id,
              status: 'requires_action',
              failureReason: 'Authentication required',
              updatedAt: new Date()
            });

            results.requiresAction.push({
              userId: user.id,
              name: user.name,
              email: user.email,
              amount: amount,
              dependents: dependents,
              paymentIntentId: paymentIntent.id
            });
          }
        } catch (error) {
          let failureReason = 'Unknown error';
          
          if (error.code === 'authentication_required') {
            failureReason = 'Authentication required';
            results.requiresAction.push({
              userId: user.id,
              name: user.name,
              email: user.email,
              amount: amount,
              dependents: dependents,
              reason: failureReason
            });
          } else {
            failureReason = error.message || 'Payment failed';
            results.failed.push({
              userId: user.id,
              name: user.name,
              email: user.email,
              amount: amount,
              dependents: dependents,
              reason: failureReason
            });
          }

          // Update transaction
          await updateDoc(transactionRef, {
            status: 'failed',
            failureReason: failureReason,
            updatedAt: new Date()
          });
        }
      }));
    }

    // Update claim with final results
    const claimStatus = results.failed.length === 0 ? 'completed' : 
                       results.succeeded.length === 0 ? 'failed' : 'partial';

    await updateDoc(claimRef, {
      totalMembersAttempted: users.length,
      totalSuccess: results.succeeded.length,
      totalFailed: results.failed.length + results.skipped.length,
      totalAmountExpected: totalAmountExpected,
      status: claimStatus,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      claimId: finalClaimId,
      results: results,
      summary: {
        totalMembers: users.length,
        succeeded: results.succeeded.length,
        failed: results.failed.length,
        requiresAction: results.requiresAction.length,
        skipped: results.skipped.length,
        totalAmount: totalAmountExpected
      }
    });

  } catch (error) {
    console.error('Error charging members:', error);
    return NextResponse.json(
      { error: 'Failed to charge members' },
      { status: 500 }
    );
  }
}
