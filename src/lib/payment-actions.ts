'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/database-schema';
import { getServerStripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';

interface Member {
  id: string;
  name: string;
  email: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  totalShares: number;
}

interface ChargingResult {
  memberId: string;
  memberName: string;
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  amount: number;
}

export async function chargeSelectedMembers(
  members: Member[],
  amountPerShare: number
): Promise<ChargingResult[]> {
  const results: ChargingResult[] = [];
  const stripe = getServerStripe();

  for (const member of members) {
    try {
      if (!member.stripeCustomerId || !member.stripePaymentMethodId) {
        results.push({
          memberId: member.id,
          memberName: member.name,
          success: false,
          error: 'No payment method available',
          amount: member.totalShares * amountPerShare,
        });
        continue;
      }

      const totalAmount = member.totalShares * amountPerShare;
      const amountInCents = Math.round(totalAmount * 100);

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: member.stripeCustomerId,
        payment_method: member.stripePaymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          memberId: member.id,
          type: 'memorial_share',
          shares: member.totalShares.toString(),
          amountPerShare: amountPerShare.toString(),
        },
        description: `Memorial Share - ${member.totalShares} share(s) @ $${amountPerShare} each`,
      });

      if (paymentIntent.status === 'succeeded') {
        // Create payment record in Firestore
        await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          amount: totalAmount,
          shares: member.totalShares,
          amountPerShare: amountPerShare,
          paymentIntentId: paymentIntent.id,
          status: 'completed',
          type: 'memorial_share',
          chargedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        // Update member's payment history
        const memberRef = doc(db, COLLECTIONS.MEMBERS, member.id);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          const newPayment = {
            id: paymentIntent.id,
            amount: totalAmount,
            shares: member.totalShares,
            amountPerShare: amountPerShare,
            date: new Date(),
            type: 'memorial_share',
            status: 'completed',
            paymentIntentId: paymentIntent.id,
          };

          await updateDoc(memberRef, {
            paymentHistory: [...(memberData.paymentHistory || []), newPayment],
            lastPaymentDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        results.push({
          memberId: member.id,
          memberName: member.name,
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: totalAmount,
        });

        console.log(`Successfully charged member ${member.name}: $${totalAmount}`);
      } else {
        results.push({
          memberId: member.id,
          memberName: member.name,
          success: false,
          error: `Payment failed: ${paymentIntent.status}`,
          amount: totalAmount,
        });
      }
    } catch (error) {
      console.error(`Error charging member ${member.name}:`, error);
      results.push({
        memberId: member.id,
        memberName: member.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        amount: member.totalShares * amountPerShare,
      });
    }
  }

  // Revalidate relevant pages
  revalidatePath('/admin/payments');
  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');

  return results;
}

export async function getMemberPaymentHistory(memberId: string) {
  try {
    const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    const memberDoc = await getDoc(memberRef);
    
    if (memberDoc.exists()) {
      const memberData = memberDoc.data();
      return memberData.paymentHistory || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

export async function getAllPayments() {
  try {
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const paymentsSnapshot = await paymentsRef.get();
    
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return payments;
  } catch (error) {
    console.error('Error fetching all payments:', error);
    return [];
  }
}
