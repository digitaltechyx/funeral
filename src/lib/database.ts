import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  COLLECTIONS,
  Member,
  Claim,
  Payment,
  Dependent,
  AuditLog,
  AdminUser,
} from './database-schema';

// Generic error class for database operations
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper function to add timestamps
const addTimestamps = (data: any) => ({
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// Helper function to update timestamp
const updateTimestamp = (data: any) => ({
  ...data,
  updatedAt: serverTimestamp(),
});

// MEMBERS CRUD Operations
export const membersService = {
  // Create a new member
  async create(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), addTimestamps(memberData));
      return docRef.id;
    } catch (error) {
      throw new DatabaseError(`Failed to create member: ${error}`);
    }
  },

  // Get member by ID
  async getById(memberId: string): Promise<Member | null> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Member;
      }
      return null;
    } catch (error) {
      throw new DatabaseError(`Failed to get member: ${error}`);
    }
  },

  // Get member by email
  async getByEmail(email: string): Promise<Member | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.MEMBERS),
        where('email', '==', email),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Member;
      }
      return null;
    } catch (error) {
      throw new DatabaseError(`Failed to get member by email: ${error}`);
    }
  },

  // Get all active members
  async getActiveMembers(): Promise<Member[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.MEMBERS),
        where('status', '==', 'Active'),
        orderBy('joinDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
    } catch (error) {
      throw new DatabaseError(`Failed to get active members: ${error}`);
    }
  },

  // Update member
  async update(memberId: string, updateData: Partial<Member>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      await updateDoc(docRef, updateTimestamp(updateData));
    } catch (error) {
      throw new DatabaseError(`Failed to update member: ${error}`);
    }
  },

  // Update wallet balance
  async updateWalletBalance(memberId: string, newBalance: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      await updateDoc(docRef, {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update wallet balance: ${error}`);
    }
  },

  // Real-time listener for member
  subscribeToMember(memberId: string, callback: (member: Member | null) => void) {
    const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Member);
      } else {
        callback(null);
      }
    });
  },
};

// CLAIMS CRUD Operations
export const claimsService = {
  // Create a new claim
  async create(claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CLAIMS), addTimestamps(claimData));
      return docRef.id;
    } catch (error) {
      throw new DatabaseError(`Failed to create claim: ${error}`);
    }
  },

  // Get claim by ID
  async getById(claimId: string): Promise<Claim | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CLAIMS, claimId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Claim;
      }
      return null;
    } catch (error) {
      throw new DatabaseError(`Failed to get claim: ${error}`);
    }
  },

  // Get claims by member ID
  async getByMemberId(memberId: string): Promise<Claim[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CLAIMS),
        where('memberId', '==', memberId),
        orderBy('submissionDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      throw new DatabaseError(`Failed to get claims by member: ${error}`);
    }
  },

  // Get all pending claims
  async getPendingClaims(): Promise<Claim[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CLAIMS),
        where('status', '==', 'Pending'),
        orderBy('submissionDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      throw new DatabaseError(`Failed to get pending claims: ${error}`);
    }
  },

  // Update claim status
  async updateStatus(claimId: string, status: Claim['status'], adminId?: string, rejectionReason?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CLAIMS, claimId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'Approved' && adminId) {
        updateData.approvedBy = adminId;
        updateData.approvedAt = serverTimestamp();
      }

      if (status === 'Rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      throw new DatabaseError(`Failed to update claim status: ${error}`);
    }
  },

  // Real-time listener for claims
  subscribeToClaims(callback: (claims: Claim[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.CLAIMS),
      orderBy('submissionDate', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const claims = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
      callback(claims);
    });
  },
};

// PAYMENTS CRUD Operations
export const paymentsService = {
  // Create a new payment record
  async create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), addTimestamps(paymentData));
      return docRef.id;
    } catch (error) {
      throw new DatabaseError(`Failed to create payment: ${error}`);
    }
  },

  // Get payments by member ID
  async getByMemberId(memberId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('memberId', '==', memberId),
        orderBy('paymentDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      throw new DatabaseError(`Failed to get payments by member: ${error}`);
    }
  },

  // Get payments by claim ID
  async getByClaimId(claimId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('claimId', '==', claimId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      throw new DatabaseError(`Failed to get payments by claim: ${error}`);
    }
  },
};

// DEPENDENTS CRUD Operations
export const dependentsService = {
  // Create a new dependent
  async create(dependentData: Omit<Dependent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.DEPENDENTS), addTimestamps(dependentData));
      return docRef.id;
    } catch (error) {
      throw new DatabaseError(`Failed to create dependent: ${error}`);
    }
  },

  // Get dependents by member ID
  async getByMemberId(memberId: string): Promise<Dependent[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.DEPENDENTS),
        where('memberId', '==', memberId),
        orderBy('addedDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dependent[];
    } catch (error) {
      throw new DatabaseError(`Failed to get dependents by member: ${error}`);
    }
  },

  // Delete dependent
  async delete(dependentId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.DEPENDENTS, dependentId);
      await deleteDoc(docRef);
    } catch (error) {
      throw new DatabaseError(`Failed to delete dependent: ${error}`);
    }
  },
};

// AUDIT LOGS Operations
export const auditLogsService = {
  // Create audit log entry
  async create(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        ...logData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw new DatabaseError(`Failed to create audit log: ${error}`);
    }
  },

  // Get audit logs by user ID
  async getByUserId(userId: string, limitCount: number = 50): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
    } catch (error) {
      throw new DatabaseError(`Failed to get audit logs by user: ${error}`);
    }
  },
};

// Batch operations for complex transactions
export const batchService = {
  // Create a batch operation
  createBatch() {
    return writeBatch(db);
  },

  // Execute batch operation
  async commitBatch(batch: any) {
    try {
      await batch.commit();
    } catch (error) {
      throw new DatabaseError(`Failed to commit batch operation: ${error}`);
    }
  },
};

