'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function DebugLoginPage() {
  const [email, setEmail] = useState('digitaltechyx@gmail.com');
  const [password, setPassword] = useState('225588Zz@');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleDebugLogin = async () => {
    setLoading(true);
    setDebugInfo(null);
    
    try {
      console.log('=== DEBUG LOGIN START ===');
      
      // Step 1: Firebase Auth
      console.log('Step 1: Attempting Firebase Auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase Auth Success:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      });
      
      // Step 2: Check members collection
      console.log('Step 2: Checking members collection...');
      const memberDoc = await getDoc(doc(db, 'members', userCredential.user.uid));
      console.log('Members document exists:', memberDoc.exists());
      
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        console.log('✅ Members data:', memberData);
        
        // Step 3: Check admin_users collection
        console.log('Step 3: Checking admin_users collection...');
        const adminDoc = await getDoc(doc(db, 'admin_users', userCredential.user.uid));
        console.log('Admin_users document exists:', adminDoc.exists());
        
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          console.log('✅ Admin_users data:', adminData);
        } else {
          console.log('❌ Admin_users document not found');
        }
        
        // Set debug info
        setDebugInfo({
          auth: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName
          },
          members: memberData,
          admin_users: adminDoc.exists() ? adminDoc.data() : null,
          role: memberData.role,
          isSuperAdmin: memberData.role === 'super_admin',
          shouldRedirectTo: memberData.role === 'super_admin' || memberData.role === 'admin' 
            ? '/admin/dashboard' 
            : '/dashboard'
        });
        
        toast({
          title: "Debug Login Successful",
          description: `Role: ${memberData.role}, Should redirect to: ${memberData.role === 'super_admin' || memberData.role === 'admin' ? '/admin/dashboard' : '/dashboard'}`,
        });
        
      } else {
        console.log('❌ Members document not found');
        setDebugInfo({
          auth: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName
          },
          members: null,
          admin_users: null,
          error: 'Members document not found'
        });
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Members document not found in Firestore",
        });
      }
      
      console.log('=== DEBUG LOGIN END ===');
      
    } catch (error: any) {
      console.error('❌ Debug login error:', error);
      setDebugInfo({
        error: error.message,
        code: error.code
      });
      
      toast({
        variant: "destructive",
        title: "Debug Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Login - Super Admin</CardTitle>
            <CardDescription>
              Test login and check role loading for super admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="digitaltechyx@gmail.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleDebugLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Debug Login...
                </>
              ) : (
                'Debug Login'
              )}
            </Button>
          </CardContent>
        </Card>

        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
          <Link href="/simple-setup">
            <Button variant="outline">Try Simple Setup</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
