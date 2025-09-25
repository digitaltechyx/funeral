# Deploy Firestore Rules to Firebase

## Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Option 2: Using Firebase Console (Manual)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `memorialshare`
3. **Go to Firestore Database** → **Rules** tab
4. **Copy and paste the new rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // TEMPORARY: Allow all operations for development
       // TODO: Replace with proper security rules before production
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. **Click "Publish"**

## After Deploying Rules

1. **Test the simple setup**: http://localhost:9002/simple-setup
2. **Create super admin account**
3. **Test login**: http://localhost:9002/debug-login
4. **Verify super admin works**

## Important: Security Note

These rules allow ALL operations for development. Before going to production, you MUST replace them with proper security rules!
