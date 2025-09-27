'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChargeResult {
  claimId: string;
  results: {
    succeeded: Array<{
      userId: string;
      name: string;
      email: string;
      amount: number;
      dependents: number;
    }>;
    failed: Array<{
      userId: string;
      name: string;
      email: string;
      amount: number;
      dependents: number;
      reason: string;
    }>;
    requiresAction: Array<{
      userId: string;
      name: string;
      email: string;
      amount: number;
      dependents: number;
      reason?: string;
      paymentIntentId?: string;
    }>;
    skipped: Array<{
      userId: string;
      name: string;
      email: string;
      reason: string;
    }>;
  };
  summary: {
    totalMembers: number;
    succeeded: number;
    failed: number;
    requiresAction: number;
    skipped: number;
    totalAmount: number;
  };
}

export default function ChargeMembersPage() {
  const [loading, setLoading] = useState(false);
  const [claimId, setClaimId] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<ChargeResult | null>(null);
  const [confirmCharge, setConfirmCharge] = useState(false);
  const { toast } = useToast();

  const handleChargeMembers = async () => {
    if (!confirmCharge) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Required',
        description: 'Please confirm that you want to charge all active members.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/stripe/charge-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: claimId || undefined,
          note: note || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast({
          title: 'Charging Complete',
          description: `Processed ${data.summary.totalMembers} members. ${data.summary.succeeded} succeeded, ${data.summary.failed} failed.`,
        });
      } else {
        throw new Error(data.error || 'Failed to charge members');
      }
    } catch (error) {
      console.error('Error charging members:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to charge members. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'requiresAction':
        return 'bg-yellow-100 text-yellow-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charge Members</h1>
          <p className="text-muted-foreground">
            Charge all active members for funeral contributions
          </p>
        </div>

        <div className="grid gap-6">
          {/* Charge Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Charge All Active Members
              </CardTitle>
              <CardDescription>
                This will charge $8 per person (including dependents) to all active members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="claimId">Claim ID (Optional)</Label>
                  <Input
                    id="claimId"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for this charge"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Additional Notes</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any additional notes for this charge..."
                  rows={3}
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This action will charge all active members immediately. 
                  Make sure you have verified the funeral claim before proceeding.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirmCharge"
                  checked={confirmCharge}
                  onChange={(e) => setConfirmCharge(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="confirmCharge" className="text-sm">
                  I confirm that I want to charge all active members for this funeral contribution
                </Label>
              </div>

              <Button 
                onClick={handleChargeMembers}
                disabled={loading || !confirmCharge}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Charging Members...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Charge All Active Members
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Charging Results
                </CardTitle>
                <CardDescription>
                  Claim ID: {result.claimId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Total Members</p>
                      <p className="text-2xl font-bold">{result.summary.totalMembers}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Succeeded</p>
                      <p className="text-2xl font-bold text-green-600">{result.summary.succeeded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-2xl font-bold">${result.summary.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round((result.summary.succeeded / result.summary.totalMembers) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(result.summary.succeeded / result.summary.totalMembers) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Detailed Results */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Succeeded */}
                  {result.results.succeeded.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Successful Charges</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.results.succeeded.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${item.amount.toFixed(2)}</p>
                              <p className="text-xs text-gray-600">
                                {item.dependents > 0 ? `+${item.dependents} dep` : 'No deps'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed */}
                  {result.results.failed.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Failed Charges</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.results.failed.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.email}</p>
                              <p className="text-xs text-red-600">{item.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${item.amount.toFixed(2)}</p>
                              <p className="text-xs text-gray-600">
                                {item.dependents > 0 ? `+${item.dependents} dep` : 'No deps'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requires Action */}
                  {result.results.requiresAction.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 mb-2">Requires Authentication</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.results.requiresAction.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.email}</p>
                              <p className="text-xs text-yellow-600">Needs re-authentication</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${item.amount.toFixed(2)}</p>
                              <p className="text-xs text-gray-600">
                                {item.dependents > 0 ? `+${item.dependents} dep` : 'No deps'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped */}
                  {result.results.skipped.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-600 mb-2">Skipped Members</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.results.skipped.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.email}</p>
                              <p className="text-xs text-gray-600">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
