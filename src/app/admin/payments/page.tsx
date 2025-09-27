'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Users, DollarSign, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { getAllMembers, getActiveMembers, getUserDependents } from '@/lib/firestore-service';
import { chargeSelectedMembers } from '@/lib/payment-actions';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  hasPaymentMethod: boolean;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  dependentsCount: number;
  totalShares: number; // 1 + dependents count
}

interface ChargingResult {
  memberId: string;
  memberName: string;
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  amount: number;
}

export default function AdminPaymentsPage() {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [chargingResults, setChargingResults] = useState<ChargingResult[]>([]);
  const [shareAmount, setShareAmount] = useState(8); // $8 per share
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const [allMembers, activeMembers] = await Promise.all([
        getAllMembers(),
        getActiveMembers()
      ]);

      // Fetch dependents for each member
      const membersWithDependents = await Promise.all(
        allMembers.map(async (member) => {
          const dependents = await getUserDependents(member.id);
          const dependentsCount = dependents.length;
          const totalShares = 1 + dependentsCount; // Member + dependents
          const isActive = activeMembers.some(active => active.id === member.id);

          return {
            id: member.id,
            name: member.name || member.displayName || 'Unknown',
            email: member.email || 'No email',
            phone: member.phone || 'No phone',
            status: isActive ? 'Active' : 'Inactive',
            hasPaymentMethod: member.hasPaymentMethod || false,
            stripeCustomerId: member.stripeCustomerId,
            stripePaymentMethodId: member.stripePaymentMethodId,
            dependentsCount,
            totalShares
          };
        })
      );

      setMembers(membersWithDependents);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch members data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleMembers = members
        .filter(member => member.hasPaymentMethod && member.status === 'Active')
        .map(member => member.id);
      setSelectedMembers(eligibleMembers);
    } else {
      setSelectedMembers([]);
    }
  };

  const handleChargeSelected = async () => {
    if (selectedMembers.length === 0) {
      toast({
        variant: "destructive",
        title: "No Members Selected",
        description: "Please select at least one member to charge.",
      });
      return;
    }

    try {
      setCharging(true);
      setChargingResults([]);

      const membersToCharge = members.filter(member => 
        selectedMembers.includes(member.id) && 
        member.hasPaymentMethod && 
        member.status === 'Active'
      );

      const results = await chargeSelectedMembers(membersToCharge, shareAmount);

      setChargingResults(results);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      toast({
        title: "Charging Complete",
        description: `Successfully charged ${successCount} members. ${failureCount} failed.`,
      });

      // Refresh members data
      await fetchMembers();
      setSelectedMembers([]);

    } catch (error) {
      console.error('Error charging members:', error);
      toast({
        variant: "destructive",
        title: "Charging Failed",
        description: "An error occurred while charging members. Please try again.",
      });
    } finally {
      setCharging(false);
    }
  };

  const eligibleMembers = members.filter(member => 
    member.hasPaymentMethod && member.status === 'Active'
  );

  const totalAmount = selectedMembers.reduce((total, memberId) => {
    const member = members.find(m => m.id === memberId);
    return total + (member ? member.totalShares * shareAmount : 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Payment Management" />
        <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Payment Management" />
      <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.reduce((total, member) => total + member.totalShares, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Including dependents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eligible Members</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eligibleMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active members with payment methods
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total to charge selected members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Charge all active members for funeral contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/payments/charge">
                <Zap className="mr-2 h-4 w-4" />
                Charge All Active Members
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Charging Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Charge Members</CardTitle>
            <CardDescription>
              Select members to charge their fair share. Each member pays $8 per share (including dependents).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMembers.length === eligibleMembers.length && eligibleMembers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All Eligible Members ({eligibleMembers.length})
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="share-amount" className="text-sm font-medium">
                    Amount per share:
                  </label>
                  <input
                    id="share-amount"
                    type="number"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button 
                  onClick={handleChargeSelected}
                  disabled={charging || selectedMembers.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {charging ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Charging...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Charge Selected ({selectedMembers.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charging Results */}
        {chargingResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Charging Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chargingResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{result.memberName}</p>
                        <p className="text-sm text-muted-foreground">
                          Amount: ${result.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result.success ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Failed: {result.error}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              Manage member payments and view their payment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Dependents</TableHead>
                  <TableHead>Total Shares</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={(checked) => 
                          handleSelectMember(member.id, checked as boolean)
                        }
                        disabled={!member.hasPaymentMethod || member.status !== 'Active'}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.hasPaymentMethod ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Added
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Added
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.dependentsCount}</TableCell>
                    <TableCell>{member.totalShares}</TableCell>
                    <TableCell>${(member.totalShares * shareAmount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}