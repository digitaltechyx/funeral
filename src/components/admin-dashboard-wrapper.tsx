'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/app/user-nav';
import { getAllMembers, getActiveMembers, getWalletPool, getDashboardData } from '@/lib/firestore-service';
import { getAllClaims } from '@/lib/claim-actions';
import { WalletPoolUpdate } from '@/components/wallet-pool-update';
import { TotalFuneralsUpdate } from '@/components/total-funerals-update';
import { Users, UserCheck, ShieldCheck, Building2, Calendar, Phone, Mail, ArrowUpRight, BarChart3, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';

export function AdminDashboardWrapper() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [allClaims, setAllClaims] = useState<any[]>([]);
  const [walletPool, setWalletPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashboard, members, active, claims, wallet] = await Promise.all([
          getDashboardData(),
          getAllMembers(),
          getActiveMembers(),
          getAllClaims(),
          getWalletPool()
        ]);
        
        setDashboardData(dashboard);
        setAllMembers(members);
        setActiveMembers(active);
        setAllClaims(claims);
        setWalletPool(wallet);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleWalletPoolUpdate = async () => {
    // Reload wallet pool data
    try {
      const wallet = await getWalletPool();
      setWalletPool(wallet);
    } catch (error) {
      console.error('Error reloading wallet pool:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const totalMembers = dashboardData.totalMembers; // Includes dependents
  const activeMembersCount = dashboardData.activeMembers; // Includes active dependents
  const totalClaims = allClaims.length;
  const pendingClaims = allClaims.filter(claim => claim.status === 'Pending').length;
  const approvedClaims = allClaims.filter(claim => claim.status === 'Approved').length;
  const paidClaims = allClaims.filter(claim => claim.status === 'Paid').length;

  const eachShareAmount = dashboardData.eachShareAmount;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <SidebarTrigger />
        <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Including dependents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMembersCount}</div>
            <p className="text-xs text-muted-foreground">
              With payment methods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              Funeral claims submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funerals</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{dashboardData?.totalFunerals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Funerals conducted
                </p>
              </div>
              <TotalFuneralsUpdate 
                currentCount={dashboardData?.totalFunerals || 0} 
                onUpdate={async () => {
                  // Reload dashboard data
                  try {
                    const [dashboard, members, active, claims, wallet] = await Promise.all([
                      getDashboardData(),
                      getAllMembers(),
                      getActiveMembers(),
                      getAllClaims(),
                      getWalletPool()
                    ]);
                    
                    setDashboardData(dashboard);
                    setAllMembers(members);
                    setActiveMembers(active);
                    setAllClaims(claims);
                    setWalletPool(wallet);
                  } catch (error) {
                    console.error('Error reloading dashboard data:', error);
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Pool</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${walletPool?.currentBalance?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Available funds
                </p>
              </div>
              <WalletPoolUpdate 
                currentBalance={walletPool?.currentBalance || 0} 
                onUpdate={handleWalletPoolUpdate} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedClaims}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{paidClaims}</div>
            <p className="text-xs text-muted-foreground">
              Completed funerals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Members Management</CardTitle>
            <CardDescription>View and manage all members</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/members">
              <div className="flex items-center text-sm font-medium text-primary hover:underline">
                View Members
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Claims Management</CardTitle>
            <CardDescription>Review and process claims</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/claims">
              <div className="flex items-center text-sm font-medium text-primary hover:underline">
                Manage Claims
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transparency Reports</CardTitle>
            <CardDescription>Create and manage reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/transparency-reports">
              <div className="flex items-center text-sm font-medium text-primary hover:underline">
                View Reports
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emergency Contacts</CardTitle>
            <CardDescription>View member emergency contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/emergency-contacts">
              <div className="flex items-center text-sm font-medium text-primary hover:underline">
                View Contacts
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
          <CardDescription>Latest submitted funeral claims</CardDescription>
        </CardHeader>
        <CardContent>
          {allClaims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Deceased</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClaims.slice(0, 5).map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.id.slice(0, 8)}...</TableCell>
                    <TableCell>{claim.memberName}</TableCell>
                    <TableCell>{claim.deceasedName}</TableCell>
                    <TableCell>
                      {claim.submissionDate ? new Date(claim.submissionDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          claim.status === 'Paid' ? 'default' :
                          claim.status === 'Approved' ? 'secondary' :
                          claim.status === 'Pending' ? 'outline' : 'destructive'
                        }
                      >
                        {claim.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claims submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
