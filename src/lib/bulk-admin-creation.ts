import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AdminData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export async function createBulkAdmins(admins: AdminData[]) {
  const results = [];
  
  for (const admin of admins) {
    try {
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        admin.email, 
        admin.password
      );
      
      // Update display name
      await updateProfile(userCredential.user, { 
        displayName: admin.name 
      });
      
      // Create admin profile in members collection
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: admin.email,
        name: admin.name,
        phone: admin.phone || '',
        role: 'admin',
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create admin profile in admin_users collection
      await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
        email: admin.email,
        name: admin.name,
        role: 'admin',
        permissions: ['read_claims', 'approve_claims', 'charge_members', 'view_reports'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      results.push({
        success: true,
        name: admin.name,
        email: admin.email,
        uid: userCredential.user.uid
      });
      
      console.log(`✅ Admin created: ${admin.name} (${admin.email})`);
      
    } catch (error: any) {
      results.push({
        success: false,
        name: admin.name,
        email: admin.email,
        error: error.message
      });
      
      console.error(`❌ Failed to create admin ${admin.name}:`, error.message);
    }
  }
  
  return results;
}

// Example usage:
export const exampleAdmins: AdminData[] = [
  {
    name: "John Smith",
    email: "john.smith@funeralshare.com",
    password: "Admin123!",
    phone: "+1 (555) 123-4567"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@funeralshare.com", 
    password: "Admin123!",
    phone: "+1 (555) 234-5678"
  },
  {
    name: "Mike Davis",
    email: "mike.davis@funeralshare.com",
    password: "Admin123!",
    phone: "+1 (555) 345-6789"
  }
];

// Function to create example admins
export async function createExampleAdmins() {
  console.log('Creating example admin accounts...');
  const results = await createBulkAdmins(exampleAdmins);
  
  console.log('\n📊 Results Summary:');
  console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name} - ${result.email}`);
    } else {
      console.log(`❌ ${result.name} - ${result.error}`);
    }
  });
  
  return results;
}
