'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testFirebaseConnection } from '@/lib/test-connection';

export default function TestFirebasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testFirebaseConnection();
      setTestResult(result ? '✅ Firebase connection successful!' : '❌ Firebase connection failed!');
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Firebase Connection Test</CardTitle>
          <CardDescription>
            Test your Firebase configuration and connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Firebase Connection'}
          </Button>
          
          {testResult && (
            <div className={`p-3 rounded-md text-sm ${
              testResult.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {testResult}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <p>This test will:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Write a test document to Firestore</li>
              <li>Read the document back</li>
              <li>Delete the test document</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

