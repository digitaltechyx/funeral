'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateUserPaymentMethodStatus(userId: string, hasPaymentMethod: boolean) {
  try {
    console.log('Updating payment method status for user:', userId, 'hasPaymentMethod:', hasPaymentMethod);
    
    // Check if user exists in MEMBERS collection
    const memberRef = doc(db, 'members', userId);
    const memberDoc = await getDoc(memberRef);
    
    if (!memberDoc.exists()) {
      console.log('User does not exist in MEMBERS collection, creating...');
      // Create user in MEMBERS collection
      await setDoc(memberRef, {
        id: userId,
        name: 'User',
        email: 'user@example.com',
        phone: '',
        status: hasPaymentMethod ? 'Active' : 'Inactive',
        joinDate: new Date(),
        walletBalance: 0,
        sadqaWallet: 0,
        role: 'member',
        stripeCustomerId: null,
        hasPaymentMethod,
        emergencyContacts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created user in MEMBERS collection');
    } else {
      console.log('User exists in MEMBERS collection, updating...');
      // Update existing user
      await updateDoc(memberRef, {
        hasPaymentMethod,
        status: hasPaymentMethod ? 'Active' : 'Inactive',
        updatedAt: new Date()
      });
      console.log('Updated user in MEMBERS collection');
    }

    // Also update in the USERS collection for consistency
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        hasPaymentMethod,
        updatedAt: new Date()
      });
      console.log('Updated user in USERS collection');
    }

    // Revalidate the dashboard and account pages to reflect the changes
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/account');
    revalidatePath('/dashboard/account/payment');

    console.log('Payment method status update completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating user payment method status:', error);
    return { success: false, error: 'Failed to update payment method status' };
  }
}
