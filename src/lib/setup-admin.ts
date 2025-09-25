import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function setupAdminAccount() {
  try {
    console.log('Setting up admin account...');
    
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'digitaltechyx@gmail.com', 
      '225588Zz@'
    );
    
    // Update display name
    await updateProfile(userCredential.user, { 
      displayName: 'Admin User' 
    });
    
    // Create admin profile in members collection
    await setDoc(doc(db, 'members', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: 'digitaltechyx@gmail.com',
      name: 'Admin User',
      phone: '',
      role: 'admin',
      status: 'Active',
      walletBalance: 0,
      joinDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create admin profile in admin_users collection
    await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
      email: 'digitaltechyx@gmail.com',
      name: 'Admin User',
      role: 'admin',
      permissions: ['read_claims', 'approve_claims', 'charge_members', 'view_reports'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('Admin account created successfully!');
    console.log('Email: digitaltechyx@gmail.com');
    console.log('Password: 225588Zz@');
    
    return userCredential.user;
  } catch (error) {
    console.error('Error setting up admin account:', error);
    throw error;
  }
}

// Function to check if admin account exists
export async function checkAdminAccount() {
  try {
    // This would be called from a client component
    // For now, we'll handle it in the AuthContext
    return true;
  } catch (error) {
    console.error('Error checking admin account:', error);
    return false;
  }
}
