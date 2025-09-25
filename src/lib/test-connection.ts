import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('Testing Firebase connection...');
    
    // Test document
    const testDocRef = doc(db, 'test', 'connection');
    const testData = {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
    };

    // Write test document
    await setDoc(testDocRef, testData);
    console.log('✅ Successfully wrote test document');

    // Read test document
    const docSnap = await getDoc(testDocRef);
    if (docSnap.exists()) {
      console.log('✅ Successfully read test document:', docSnap.data());
    } else {
      console.log('❌ Test document not found');
      return false;
    }

    // Clean up test document
    await deleteDoc(testDocRef);
    console.log('✅ Successfully cleaned up test document');

    console.log('🎉 Firebase connection test passed!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

// Test function that can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).testFirebaseConnection = testFirebaseConnection;
}

