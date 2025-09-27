'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/database-schema';
import { revalidatePath } from 'next/cache';

export async function updateWalletPool(
  newBalance: number,
  adminId: string,
  adminName: string,
  reason: string
) {
  try {
    console.log('Updating wallet pool:', { newBalance, adminId, adminName, reason });
    
    // Update the wallet pool document
    await updateDoc(doc(db, COLLECTIONS.WALLET_POOL, 'main'), {
      currentBalance: newBalance,
      lastUpdatedBy: adminId,
      lastUpdateReason: reason,
      lastUpdateBy: adminName,
      updatedAt: serverTimestamp(),
    });
    
    console.log('Wallet pool updated successfully');
    
    // Revalidate relevant pages
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      message: 'Wallet pool updated successfully' 
    };
  } catch (error) {
    console.error('Error updating wallet pool:', error);
    return { 
      success: false, 
      message: 'Failed to update wallet pool' 
    };
  }
}
