// Script to create super admin documents in Firestore
// Run this in Firebase Console → Firestore → Start collection

// 1. Create document in 'members' collection
// Document ID: [USER_UID_FROM_AUTH] (copy this from Authentication users)
// Document data:
{
  "uid": "[USER_UID_FROM_AUTH]",
  "email": "digitaltechyx@gmail.com",
  "name": "Super Admin",
  "phone": "",
  "role": "super_admin",
  "status": "Active",
  "walletBalance": 0,
  "joinDate": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}

// 2. Create document in 'admin_users' collection
// Document ID: [USER_UID_FROM_AUTH] (same as above)
// Document data:
{
  "email": "digitaltechyx@gmail.com",
  "name": "Super Admin",
  "role": "super_admin",
  "permissions": [
    "read_claims",
    "approve_claims", 
    "charge_members",
    "view_reports",
    "create_admins",
    "remove_admins",
    "manage_system"
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}

// Instructions:
// 1. Go to Firebase Console → Authentication → Users
// 2. Find digitaltechyx@gmail.com user and copy the UID
// 3. Go to Firestore Database
// 4. Create collection 'members' if it doesn't exist
// 5. Create document with UID as document ID
// 6. Add the first JSON object as document data
// 7. Create collection 'admin_users' if it doesn't exist  
// 8. Create document with same UID as document ID
// 9. Add the second JSON object as document data
