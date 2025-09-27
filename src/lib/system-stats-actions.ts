'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/database-schema';
import { revalidatePath } from 'next/cache';

// Initialize system stats if it doesn't exist
export async function initializeSystemStats() {
  try {
    const statsDoc = await getDoc(doc(db, COLLECTIONS.SYSTEM_STATS, 'main'));
    if (!statsDoc.exists()) {
      await setDoc(doc(db, COLLECTIONS.SYSTEM_STATS, 'main'), {
        totalFunerals: 0,
        lastUpdatedBy: '',
        lastUpdateReason: 'Initial setup',
        lastUpdatedBy: 'System',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('System stats initialized');
    }
  } catch (error) {
    console.error('Error initializing system stats:', error);
  }
}

// Get system stats
export async function getSystemStats() {
  try {
    // Initialize system stats if it doesn't exist
    await initializeSystemStats();
    
    const statsDoc = await getDoc(doc(db, COLLECTIONS.SYSTEM_STATS, 'main'));
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }
    return {
      totalFunerals: 0,
      lastUpdatedBy: '',
      lastUpdateReason: '',
      lastUpdatedBy: '',
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      totalFunerals: 0,
      lastUpdatedBy: '',
      lastUpdateReason: '',
      lastUpdatedBy: '',
    };
  }
}

// Update total funerals count
export async function updateTotalFunerals(
  newCount: number,
  adminId: string,
  adminName: string,
  reason: string
) {
  try {
    console.log('Updating total funerals:', { newCount, adminId, adminName, reason });
    
    // Ensure system stats document exists first
    await initializeSystemStats();
    
    // Update the system stats document
    await updateDoc(doc(db, COLLECTIONS.SYSTEM_STATS, 'main'), {
      totalFunerals: newCount,
      lastUpdatedBy: adminId,
      lastUpdateReason: reason,
      lastUpdatedBy: adminName,
      updatedAt: serverTimestamp(),
    });
    
    console.log('Total funerals updated successfully');
    
    // Revalidate relevant pages
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      message: 'Total funerals count updated successfully' 
    };
  } catch (error) {
    console.error('Error updating total funerals:', error);
    return { 
      success: false, 
      message: 'Failed to update total funerals count' 
    };
  }
}
