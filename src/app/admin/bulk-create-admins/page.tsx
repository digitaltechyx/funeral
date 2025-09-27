'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { createBulkAdmins } from '@/lib/bulk-admin-creation';
import { useToast } from '@/hooks/use-toast';

interface AdminData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export default function BulkCreateAdminsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const parseCSVData = (csvText: string): AdminData[] => {
    const lines = csvText.trim().split('\n');
    const admins: AdminData[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [name, email, password, phone] = line.split(',').map(field => field.trim());
      
      if (name && email && password) {
        admins.push({
          name,
          email,
          password,
          phone: phone || ''
        });
      }
    }
    
    return admins;
  };

  const handleBulkCreate = async () => {
    if (!user) return;
    
    const admins = parseCSVData(csvData);
    
    if (admins.length === 0) {
      toast({
        variant: "destructive",
        title: "No Valid Data",
        description: "Please provide valid CSV data with at least name, email, and password columns.",
      });
      return;
    }

    setLoading(true);
    try {
      const results = await createBulkAdmins(admins);
      setResults(results);
      setShowResults(true);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Bulk Creation Complete",
        description: `Successfully created ${successCount} admins. ${failCount} failed.`,
      });
    } catch (error: any) {
      console.error('Error in bulk creation:', error);
      toast({
        variant: "destructive",
        title: "Bulk Creation Failed",
        description: error.message || "Failed to create admins in bulk.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const template = 'name,email,password,phone\nJohn Doe,john@example.com,password123,+1-555-123-4567\nJane Smith,jane@example.com,password456,+1-555-987-6543';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showResults) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Bulk Create Admins" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Bulk Creation Results
                </CardTitle>
                <CardDescription>
                  Results of the bulk admin creation process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.email}</p>
                        </div>
                        <div className="text-right">
                          {result.success ? (
                            <span className="text-green-600 text-sm">✅ Success</span>
                          ) : (
                            <span className="text-red-600 text-sm">❌ Failed</span>
                          )}
                        </div>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button onClick={() => setShowResults(false)}>
                    Create More Admins
                  </Button>
                  <Button variant="outline" onClick={() => setResults([])}>
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Bulk Create Admins" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Bulk Create Admins
              </CardTitle>
              <CardDescription>
                Create multiple admin accounts at once using CSV data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-data">CSV Data</Label>
                  <Textarea
                    id="csv-data"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="name,email,password,phone&#10;John Doe,john@example.com,password123,+1-555-123-4567&#10;Jane Smith,jane@example.com,password456,+1-555-987-6543"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Upload className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    Upload CSV File
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>CSV Format:</strong> name,email,password,phone</p>
                    <p><strong>Required fields:</strong> name, email, password</p>
                    <p><strong>Optional fields:</strong> phone</p>
                    <p><strong>Note:</strong> Each admin will have standard admin permissions.</p>
                  </div>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleBulkCreate} 
                disabled={loading || !csvData.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Admins...
                  </>
                ) : (
                  'Create Admins from CSV'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
