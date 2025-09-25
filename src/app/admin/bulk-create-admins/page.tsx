'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createBulkAdmins, AdminData } from '@/lib/bulk-admin-creation';
import { Loader2, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function BulkCreateAdminsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [csvData, setCsvData] = useState('');
  const { toast } = useToast();

  const parseCSVData = (csvText: string): AdminData[] => {
    const lines = csvText.trim().split('\n');
    const admins: AdminData[] = [];
    
    // Skip header row if it exists
    const dataLines = lines[0].toLowerCase().includes('name,email,password') 
      ? lines.slice(1) 
      : lines;
    
    for (const line of dataLines) {
      const [name, email, password, phone] = line.split(',').map(s => s.trim());
      
      if (name && email && password) {
        admins.push({
          name,
          email,
          password,
          phone: phone || undefined
        });
      }
    }
    
    return admins;
  };

  const handleBulkCreate = async () => {
    if (!csvData.trim()) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "Please enter admin data in CSV format.",
      });
      return;
    }

    setLoading(true);
    try {
      const admins = parseCSVData(csvData);
      
      if (admins.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid Data",
          description: "No valid admin data found. Please check your CSV format.",
        });
        return;
      }

      const results = await createBulkAdmins(admins);
      setResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Bulk Creation Complete",
        description: `Created ${successCount} admins successfully. ${failCount} failed.`,
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create admins.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleCSV = `John Smith,john.smith@funeralshare.com,Admin123!,+1 (555) 123-4567
Sarah Johnson,sarah.johnson@funeralshare.com,Admin123!,+1 (555) 234-5678
Mike Davis,mike.davis@funeralshare.com,Admin123!,+1 (555) 345-6789`;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-headline">Bulk Create Admins</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Bulk Admin Creation
              </CardTitle>
              <CardDescription>
                Create multiple admin accounts at once using CSV format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="csv-data">Admin Data (CSV Format)</Label>
                <Textarea
                  id="csv-data"
                  placeholder="Enter admin data in CSV format..."
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  disabled={loading}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground">
                  Format: Name, Email, Password, Phone (optional)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">Example CSV:</h3>
                <pre className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                  {exampleCSV}
                </pre>
              </div>

              <Button 
                onClick={handleBulkCreate}
                disabled={loading || !csvData.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admins...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create {csvData.trim() ? parseCSVData(csvData).length : 0} Admins
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline">Creation Results</CardTitle>
                <CardDescription>
                  Summary of admin creation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.name} - {result.email}
                        </p>
                        {!result.success && (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary:</h3>
                  <p className="text-sm">
                    ✅ Successful: {results.filter(r => r.success).length} | 
                    ❌ Failed: {results.filter(r => !r.success).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
