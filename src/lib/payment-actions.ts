'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
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
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          memberId: member.id,
          type: 'memorial_share',
          shares: member.totalShares.toString(),
          amountPerShare: amountPerShare.toString(),
        },
        description: `Memorial Share - ${member.totalShares} share(s) @ $${amountPerShare} each`,
      });

      // Create payment record in Firestore for both successful and failed payments
      const paymentRecord = {
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        amount: totalAmount,
        shares: member.totalShares,
        amountPerShare: amountPerShare,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        type: 'memorial_share',
        chargedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        error: paymentIntent.status !== 'succeeded' ? `Payment failed: ${paymentIntent.status}` : undefined,
      };

      console.log('Creating payment record:', paymentRecord);
      const paymentDocRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentRecord);
      console.log('Payment record created with ID:', paymentDocRef.id);

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
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.status !== 'succeeded' ? `Payment failed: ${paymentIntent.status}` : undefined,
        };

        await updateDoc(memberRef, {
          paymentHistory: [...(memberData.paymentHistory || []), newPayment],
          lastPaymentDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (paymentIntent.status === 'succeeded') {
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

        console.log(`Failed to charge member ${member.name}: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error(`Error charging member ${member.name}:`, error);
      
      const totalAmount = member.totalShares * amountPerShare;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Store failed payment in database
      try {
        const paymentRecord = {
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          amount: totalAmount,
          shares: member.totalShares,
          amountPerShare: amountPerShare,
          paymentIntentId: null,
          status: 'failed',
          type: 'memorial_share',
          chargedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          error: errorMessage,
        };

        console.log('Creating failed payment record:', paymentRecord);
        const paymentDocRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentRecord);
        console.log('Failed payment record created with ID:', paymentDocRef.id);

        // Update member's payment history
        const memberRef = doc(db, COLLECTIONS.MEMBERS, member.id);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          const newPayment = {
            id: `failed_${Date.now()}`,
            amount: totalAmount,
            shares: member.totalShares,
            amountPerShare: amountPerShare,
            date: new Date(),
            type: 'memorial_share',
            status: 'failed',
            paymentIntentId: null,
            error: errorMessage,
          };

          await updateDoc(memberRef, {
            paymentHistory: [...(memberData.paymentHistory || []), newPayment],
            lastPaymentDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (dbError) {
        console.error('Error storing failed payment:', dbError);
      }
      
      results.push({
        memberId: member.id,
        memberName: member.name,
        success: false,
        error: errorMessage,
        amount: totalAmount,
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
    console.log('Fetching payment history for member:', memberId);
    
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const q = query(
      paymentsRef, 
      where('memberId', '==', memberId),
      orderBy('chargedAt', 'desc')
    );
    const paymentsSnapshot = await getDocs(q);
    
    console.log('Payment history query result:', {
      memberId,
      totalDocs: paymentsSnapshot.docs.length,
      docs: paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        memberId: doc.data().memberId,
        status: doc.data().status,
        amount: doc.data().amount,
        error: doc.data().error
      }))
    });
    
    const payments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount || 0,
        shares: data.shares || 1,
        amountPerShare: data.amountPerShare || 0,
        date: data.chargedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        type: data.type || 'memorial_share',
        status: data.status || 'pending',
        paymentIntentId: data.paymentIntentId || '',
        error: data.error || undefined,
      };
    });
    
    console.log('Processed payments:', payments);
    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

export async function getAllPayments() {
  try {
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const q = query(paymentsRef, orderBy('chargedAt', 'desc'));
    const paymentsSnapshot = await getDocs(q);
    
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

export async function getChargingReports() {
  try {
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const q = query(paymentsRef, orderBy('chargedAt', 'desc'));
    const paymentsSnapshot = await getDocs(q);
    
    const allPayments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Separate successful and failed payments
    const successfulPayments = allPayments.filter(payment => payment.status === 'completed');
    const failedPayments = allPayments.filter(payment => payment.status === 'failed');
    
    // Calculate statistics
    const totalSuccessfulAmount = successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalFailedAmount = failedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalMembersCharged = successfulPayments.length;
    const totalMembersFailed = failedPayments.length;
    
    return {
      successfulPayments,
      failedPayments,
      statistics: {
        totalSuccessfulAmount,
        totalFailedAmount,
        totalMembersCharged,
        totalMembersFailed,
        successRate: allPayments.length > 0 ? (totalMembersCharged / allPayments.length) * 100 : 0,
      },
      allPayments,
    };
  } catch (error) {
    console.error('Error fetching charging reports:', error);
    return {
      successfulPayments: [],
      failedPayments: [],
      statistics: {
        totalSuccessfulAmount: 0,
        totalFailedAmount: 0,
        totalMembersCharged: 0,
        totalMembersFailed: 0,
        successRate: 0,
      },
      allPayments: [],
    };
  }
}
