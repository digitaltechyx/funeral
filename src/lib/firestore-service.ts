import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { COLLECTIONS, Dependent, TransparencyReport } from '@/lib/database-schema';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getLatestClaim, getAllClaims } from './claim-actions';
import { getSystemStats } from './system-stats-actions';

// Helper function to convert Firebase Timestamp to string
function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  
  // If it's a Firebase Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString();
  }
  
  // If it's a string, return as is
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  // Fallback
  return String(timestamp);
}

// Get all members from Firestore
export async function getAllMembers() {
  try {
    const membersSnapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
    return membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinDate: formatTimestamp(data.joinDate),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

// Get active members only
export async function getActiveMembers() {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('status', '==', 'Active')
    );
    const activeMembersSnapshot = await getDocs(q);
    return activeMembersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinDate: formatTimestamp(data.joinDate),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error fetching active members:', error);
    return [];
  }
}




// Initialize wallet pool if it doesn't exist
export async function initializeWalletPool() {
  try {
    const walletPoolDoc = await getDoc(doc(db, COLLECTIONS.WALLET_POOL, 'main'));
    if (!walletPoolDoc.exists()) {
      await setDoc(doc(db, COLLECTIONS.WALLET_POOL, 'main'), {
        currentBalance: 0,
        totalCollected: 0,
        totalWithdrawn: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastTransactionDate: null
      });
      console.log('Wallet pool initialized');
    }
  } catch (error) {
    console.error('Error initializing wallet pool:', error);
  }
}

// Get wallet pool data
export async function getWalletPool() {
  try {
    // Initialize wallet pool if it doesn't exist
    await initializeWalletPool();
    
    const walletPoolDoc = await getDoc(doc(db, COLLECTIONS.WALLET_POOL, 'main'));
    if (walletPoolDoc.exists()) {
      const data = walletPoolDoc.data();
      return {
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        lastTransactionDate: formatTimestamp(data.lastTransactionDate)
      };
    }
    return {
      currentBalance: 0,
      totalCollected: 0,
      totalWithdrawn: 0,
    };
  } catch (error) {
    console.error('Error fetching wallet pool:', error);
    return {
      currentBalance: 0,
      totalCollected: 0,
      totalWithdrawn: 0,
    };
  }
}

// Get dashboard data with real Firestore data
export async function getDashboardData() {
  try {
    const [allMembers, activeMembers, walletPool, latestClaim, systemStats] = await Promise.all([
      getAllMembers(),
      getActiveMembers(),
      getWalletPool(),
      getLatestClaim(),
      getSystemStats()
    ]);

    // Calculate total dependents for all members
    const allDependents = await getAllDependents();
    const activeDependents = await getActiveDependents();

    // Total members = member accounts + all dependents
    const totalMembers = allMembers.length + allDependents.length;
    
    // Active members = active member accounts + their dependents
    const activeMembersCount = activeMembers.length + activeDependents.length;
    
    const totalFunerals = systemStats.totalFunerals || 0;
    // Fixed $8 per member (including dependents)
    const eachShareAmount = 8;

    return {
      totalMembers,
      activeMembers: activeMembersCount,
      walletBalance: 0, // This will be user-specific
      eachShareAmount: parseFloat(eachShareAmount.toFixed(2)),
      dependentsCount: 0, // This will be user-specific
      totalFunerals,
      maxPayout: 8000,
      walletPool: walletPool.currentBalance || 0,
      sadqaWallet: 0, // This will be user-specific
      latestClaim: latestClaim,
      userStatus: 'Active' // This will be user-specific
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    // Return fallback data
    return {
      totalMembers: 0,
      activeMembers: 0,
      walletBalance: 0,
      eachShareAmount: 0,
      dependentsCount: 0,
      totalFunerals: 0,
      maxPayout: 8000,
      walletPool: 0,
      sadqaWallet: 0,
      latestClaim: null,
      userStatus: 'Inactive'
    };
  }
}

// Get user-specific dashboard data
export async function getUserDashboardData(userId: string) {
  try {
    const [dashboardData, userDoc, userDependents] = await Promise.all([
      getDashboardData(),
      getDoc(doc(db, COLLECTIONS.MEMBERS, userId)),
      getUserDependents(userId)
    ]);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userDependentsCount = userDependents.length;
      
      // Calculate user's total share amount
      // User pays for: 1 (themselves) + dependents count
      const userTotalShares = 1 + userDependentsCount;
      const userTotalPayment = dashboardData.eachShareAmount * userTotalShares;
      
      return {
        ...dashboardData,
        walletBalance: userData.walletBalance || 0,
        sadqaWallet: userData.sadqaWallet || 0,
        dependentsCount: userDependentsCount,
        userStatus: userData.status || 'Inactive',
        userTotalShares: userTotalShares,
        userTotalPayment: parseFloat(userTotalPayment.toFixed(2))
      };
    }

    return dashboardData;
  } catch (error) {
    console.error('Error getting user dashboard data:', error);
    return getDashboardData();
  }
}

// Get all dependents (for counting total members)
export async function getAllDependents() {
  try {
    const dependentsSnapshot = await getDocs(collection(db, COLLECTIONS.DEPENDENTS));
    return dependentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        addedDate: formatTimestamp(data.addedDate),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error fetching all dependents:', error);
    return [];
  }
}

// Get dependents of active members only (for counting active members)
export async function getActiveDependents() {
  try {
    // First get all active members
    const activeMembers = await getActiveMembers();
    const activeMemberIds = activeMembers.map(member => member.id);
    
    if (activeMemberIds.length === 0) {
      return [];
    }
    
    // Get dependents of active members only
    const q = query(
      collection(db, COLLECTIONS.DEPENDENTS),
      where('memberId', 'in', activeMemberIds)
    );
    const dependentsSnapshot = await getDocs(q);
    return dependentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        addedDate: formatTimestamp(data.addedDate),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error fetching active dependents:', error);
    return [];
  }
}

// Get user's dependents
export async function getUserDependents(memberId: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.DEPENDENTS),
      where('memberId', '==', memberId)
    );
    const dependentsSnapshot = await getDocs(q);
    const dependents = dependentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        addedDate: formatTimestamp(data.addedDate),
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt)
      };
    });
    
    // Sort by addedDate on the client side to avoid index requirement
    return dependents.sort((a, b) => {
      const dateA = new Date(a.addedDate);
      const dateB = new Date(b.addedDate);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
  } catch (error) {
    console.error('Error fetching user dependents:', error);
    return [];
  }
}

// Add a new dependent
export async function addDependent(memberId: string, dependentData: { name: string; relationship: string }) {
  try {
    const dependentRef = await addDoc(collection(db, COLLECTIONS.DEPENDENTS), {
      memberId,
      name: dependentData.name,
      relationship: dependentData.relationship,
      addedDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return dependentRef.id;
  } catch (error) {
    console.error('Error adding dependent:', error);
    throw error;
  }
}

// Delete a dependent
export async function deleteDependent(dependentId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.DEPENDENTS, dependentId));
    return true;
  } catch (error) {
    console.error('Error deleting dependent:', error);
    throw error;
  }
}

// Update a dependent
export async function updateDependent(dependentId: string, updateData: { name?: string; relationship?: string }) {
  try {
    await updateDoc(doc(db, COLLECTIONS.DEPENDENTS, dependentId), {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating dependent:', error);
    throw error;
  }
}

// ===== TRANSPARENCY REPORTS =====

// Get all transparency reports
export async function getAllTransparencyReports() {
  try {
    const reportsRef = collection(db, COLLECTIONS.TRANSPARENCY_REPORTS);
    const snapshot = await getDocs(reportsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt)
    })) as TransparencyReport[];
  } catch (error) {
    console.error('Error fetching transparency reports:', error);
    return [];
  }
}

// Get latest published transparency report
export async function getLatestPublishedTransparencyReport() {
  try {
    const reportsRef = collection(db, COLLECTIONS.TRANSPARENCY_REPORTS);
    const q = query(
      reportsRef,
      where('status', '==', 'Published'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt)
    } as TransparencyReport;
  } catch (error) {
    console.error('Error fetching latest transparency report:', error);
    return null;
  }
}

// Create a new transparency report
export async function createTransparencyReport(reportData: {
  title: string;
  message: string;
  claimId?: string;
  expenses: {
    id: string;
    description: string;
    amount: number;
    category: 'Service' | 'Product' | 'Transportation' | 'Other';
  }[];
  totalExpenses: number;
  billImageUrls: string[];
  wordDocumentUrl?: string;
  createdBy: string;
}) {
  try {
    const reportsRef = collection(db, COLLECTIONS.TRANSPARENCY_REPORTS);
    const newReportRef = await addDoc(reportsRef, {
      ...reportData,
      status: 'Published',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return newReportRef.id;
  } catch (error) {
    console.error('Error creating transparency report:', error);
    throw error;
  }
}

// Upload bill images to Firebase Storage
export async function uploadBillImages(files: File[], reportId: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${reportId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `transparency-reports/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading bill images:', error);
    throw error;
  }
}

// Update a transparency report
export async function updateTransparencyReport(reportId: string, updateData: {
  title?: string;
  message?: string;
  claimId?: string;
  expenses?: {
    id: string;
    description: string;
    amount: number;
    category: 'Service' | 'Product' | 'Transportation' | 'Other';
  }[];
  totalExpenses?: number;
  billImageUrls?: string[];
  wordDocumentUrl?: string;
  status?: 'Draft' | 'Published';
}) {
  try {
    await updateDoc(doc(db, COLLECTIONS.TRANSPARENCY_REPORTS, reportId), {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating transparency report:', error);
    throw error;
  }
}

// Delete a transparency report
export async function deleteTransparencyReport(reportId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TRANSPARENCY_REPORTS, reportId));
    return true;
  } catch (error) {
    console.error('Error deleting transparency report:', error);
    throw error;
  }
}









