'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateUserPaymentMethodStatus(userId: string, hasPaymentMethod: boolean) {
  try {
    // Update in the MEMBERS collection (this is what the dashboard uses)
    const memberRef = doc(db, 'members', userId);
    
    await updateDoc(memberRef, {
      hasPaymentMethod,
      status: hasPaymentMethod ? 'Active' : 'Inactive',
      updatedAt: new Date()
    });

    // Also update in the USERS collection for consistency
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      hasPaymentMethod,
      updatedAt: new Date()
    });

    // Revalidate the dashboard and account pages to reflect the changes
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/account');
    revalidatePath('/dashboard/account/payment');

    return { success: true };
  } catch (error) {
    console.error('Error updating user payment method status:', error);
    return { success: false, error: 'Failed to update payment method status' };
  }
}
