'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, Claim } from '@/lib/database-schema';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  getDoc,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

// Submit a new claim
export async function submitClaim(formData: FormData) {
  try {
    console.log('Starting claim submission...');
    const deceasedName = formData.get('deceasedName') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const zipCode = formData.get('zipCode') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;
    const relationship = formData.get('relationship') as string;
    const dateOfDeath = formData.get('dateOfDeath') as string;
    const notes = formData.get('notes') as string;
    const memberId = formData.get('memberId') as string;
    const memberName = formData.get('memberName') as string;
    const memberEmail = formData.get('memberEmail') as string;
    const deathCertificate = formData.get('deathCertificate') as File;

    // Validate required fields
    if (!deceasedName || !address || !city || !zipCode || !state || !country || !relationship || !dateOfDeath || !memberId || !memberName || !memberEmail) {
      return { success: false, message: 'All required fields must be filled.' };
    }

    if (!deathCertificate || deathCertificate.size === 0) {
      return { success: false, message: 'Death certificate is required.' };
    }

    // File size validation is handled on client side with compression

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(deathCertificate.type)) {
      return { success: false, message: 'Death certificate must be a JPG, PNG, or PDF file.' };
    }

    // Upload death certificate to Firebase Storage
    console.log('Uploading death certificate to Firebase Storage...');
    const fileName = `death-certificates/${memberId}_${Date.now()}_${deathCertificate.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, deathCertificate);
    const deathCertificateURL = await getDownloadURL(storageRef);
    console.log('Death certificate uploaded successfully:', deathCertificateURL);

    // Create claim document
    console.log('Creating claim document in Firestore...');
    const claimData: Omit<Claim, 'id'> = {
      memberId,
      memberName,
      memberEmail,
      deceasedName,
      address,
      city,
      zipCode,
      state,
      country,
      relationship,
      dateOfDeath: new Date(dateOfDeath),
      status: 'Pending',
      submissionDate: new Date(),
      funeralDate: new Date(), // Will be updated when approved
      notes: notes || '',
      deathCertificateFileName: deathCertificate.name,
      deathCertificateFileSize: deathCertificate.size,
      deathCertificateFileType: deathCertificate.type,
      deathCertificateURL,
      documents: [deathCertificateURL],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, COLLECTIONS.CLAIMS), claimData);
    
    console.log('Claim submitted successfully:', docRef.id);
    revalidatePath('/dashboard/claims');
    revalidatePath('/admin/claims');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      message: 'Claim submitted successfully.', 
      claimId: docRef.id 
    };

  } catch (error) {
    console.error('Error submitting claim:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('storage')) {
        return { 
          success: false, 
          message: 'Failed to upload death certificate. Please try again.' 
        };
      } else if (error.message.includes('firestore')) {
        return { 
          success: false, 
          message: 'Failed to save claim data. Please try again.' 
        };
      }
    }
    
    return { 
      success: false, 
      message: 'Failed to submit claim. Please try again.' 
    };
  }
}

// Get all claims
export async function getAllClaims() {
  try {
    const claimsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.CLAIMS), orderBy('submissionDate', 'desc'))
    );
    
    return claimsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateOfDeath: doc.data().dateOfDeath?.toDate(),
      funeralDate: doc.data().funeralDate?.toDate(),
      submissionDate: doc.data().submissionDate?.toDate(),
      approvedAt: doc.data().approvedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Claim[];
  } catch (error) {
    console.error('Error fetching claims:', error);
    return [];
  }
}

// Get claims by member (using client-side filtering to avoid composite index requirement)
export async function getClaimsByMember(memberId: string) {
  try {
    console.log('Fetching claims for member:', memberId);
    
    // Get all claims and filter client-side to avoid composite index requirement
    const allClaims = await getAllClaims();
    console.log('Total claims fetched:', allClaims.length);
    
    // Filter by memberId and sort by submissionDate
    const memberClaims = allClaims
      .filter(claim => claim.memberId === memberId)
      .sort((a, b) => {
        const dateA = a.submissionDate instanceof Date ? a.submissionDate : new Date(a.submissionDate);
        const dateB = b.submissionDate instanceof Date ? b.submissionDate : new Date(b.submissionDate);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
    
    console.log('Member claims found:', memberClaims.length);
    return memberClaims;
  } catch (error) {
    console.error('Error fetching member claims:', error);
    return [];
  }
}

// Update claim status
export async function updateClaimStatus(claimId: string, newStatus: 'Pending' | 'Approved' | 'Rejected' | 'Paid') {
  try {
    const claimRef = doc(db, COLLECTIONS.CLAIMS, claimId);
    await updateDoc(claimRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    console.log('Claim status updated:', claimId, 'to', newStatus);
    revalidatePath('/dashboard/claims');
    revalidatePath('/admin/claims');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Claim status updated successfully.' };
  } catch (error) {
    console.error('Error updating claim status:', error);
    return { success: false, message: 'Failed to update claim status. Please try again.' };
  }
}

// Delete claim
export async function deleteClaim(claimId: string) {
  try {
    // First, check if the claim exists
    const claimRef = doc(db, COLLECTIONS.CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists()) {
      console.log('Claim does not exist (already deleted):', claimId);
      return { 
        success: true, 
        message: 'Claim was already deleted.' 
      };
    }
    
    // Get claim data for cleanup
    const claimData = claimDoc.data();
    
    // Delete death certificate from storage
    if (claimData.deathCertificateURL) {
      try {
        const deathCertRef = ref(storage, claimData.deathCertificateURL);
        await deleteObject(deathCertRef);
        console.log('Death certificate deleted from storage');
      } catch (storageError) {
        console.warn('Could not delete death certificate from storage:', storageError);
      }
    }
    
    // Delete the claim document
    await deleteDoc(claimRef);
    
    console.log('Claim deleted successfully:', claimId);
    revalidatePath('/dashboard/claims');
    revalidatePath('/admin/claims');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Claim deleted successfully.' };
  } catch (error) {
    console.error('Error deleting claim:', error);
    return { success: false, message: 'Failed to delete claim. Please try again.' };
  }
}

// Get latest claim for dashboard
export async function getLatestClaim() {
  try {
    const q = query(
      collection(db, COLLECTIONS.CLAIMS),
      orderBy('submissionDate', 'desc'),
      limit(1)
    );
    const latestClaimSnapshot = await getDocs(q);
    
    if (latestClaimSnapshot.empty) {
      return null;
    }
    
    const doc = latestClaimSnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateOfDeath: data.dateOfDeath?.toDate(),
      funeralDate: data.funeralDate?.toDate(),
      submissionDate: data.submissionDate?.toDate(),
      approvedAt: data.approvedAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Claim;
  } catch (error) {
    console.error('Error fetching latest claim:', error);
    return null;
  }
}
