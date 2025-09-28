"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getUserDashboardData } from "@/lib/firestore-service";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { TransparencyReportCard } from "@/components/app/dashboard/transparency-report-card";
import { LatestClaimsCard } from "@/components/app/dashboard/latest-claims-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/app/user-nav";
import { Users, HeartHandshake, CircleDollarSign, ShieldCheck, CheckCircle, Building2, Coins, Loader2, RefreshCw } from "lucide-react";

export function DashboardWrapper() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (user?.uid) {
      try {
        setLoading(true);
        const dashboardData = await getUserDashboardData(user.uid);
        setData(dashboardData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.uid]);

  // Auto-refresh disabled - manual refresh only
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (user?.uid && !loading) {
  //       loadDashboardData();
  //     }
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [user?.uid, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger />
          <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">My Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger />
          <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">My Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
          <div className="flex items-center justify-center h-64">
            <p>Unable to load dashboard data.</p>
          </div>
        </main>
      </div>
    );
  }

  const formattedShare = `$${data.eachShareAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedPayout = `$${data.maxPayout.toLocaleString('en-US')}`;
  const formattedWalletPool = `$${data.walletPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedSadqaWallet = `$${data.sadqaWallet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedUserTotalPayment = `$${data.userTotalPayment?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  
  // Calculate how many memorials the wallet pool can cover
  // Each memorial costs $8,000 (fixed cost)
  const memorialsCanCover = data.walletPool / 8000;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">My Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <UserNav />
        </div>
      </header>
      <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">
        {/* Welcome Message */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-900">
                  Congratulations! Memorial Share has reached {data.activeMembers} Total Members
                </h2>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">
                  To officially begin the memorial assistance, we need 1,000 total members (including dependents).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What makes a member active?</h3>
                  <p className="text-gray-700">
                    Anyone who has added a valid payment method becomes an active member. 
                    If you have not added one yet, please do so to participate and support our community.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How does the share system work?</h3>
                  <p className="text-gray-700">
                    Each member (including dependents) pays a fixed <span className="font-bold text-green-600">$8 per memorial</span>. 
                    This simple, transparent pricing ensures everyone contributes equally to support our community.
                  </p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-bold text-blue-600">Your share:</span> You pay for {data.userTotalShares || 1} members (1 for yourself + {data.dependentsCount} for dependents) = <span className="font-bold text-green-600">{formattedUserTotalPayment}</span> per memorial.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About Sadqa Wallet</h3>
                  <p className="text-gray-700">
                    The Sadqa Wallet allows you to make charitable donations up to $1,000 via Zelle. 
                    These donations are used for community needs, and you'll receive detailed reports on how your sadqa is used.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Row - 4 Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="ACTIVE MEMBER" 
            value={data.activeMembers} 
            icon={CheckCircle} 
            description="Member with active payment method"
            className="bg-teal-50 border-teal-200"
          />
          <StatCard 
            title="TOTAL MEMBERS" 
            value={data.totalMembers} 
            icon={Users} 
            description="Total Members"
            className="bg-blue-50 border-blue-200"
          />
          <StatCard 
            title="JANAZAH" 
            value={data.totalFunerals} 
            icon={ShieldCheck} 
            description="Total Memorials conducted so far"
            className="bg-purple-50 border-purple-200"
          />
          <StatCard 
            title="EACH SHARE" 
            value={formattedShare} 
            icon={CircleDollarSign} 
            description={`Max payout per Janazah ${formattedPayout}`}
            className="bg-orange-50 border-orange-200"
          />
        </div>

        {/* Bottom Row - 2 Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard 
            title="WALLET POOL" 
            value={formattedWalletPool} 
            icon={Building2} 
            description={`${memorialsCanCover.toFixed(3)} Memorial${memorialsCanCover !== 1 ? 's' : ''} Can Cover`}
            className="bg-purple-50 border-purple-200"
          />
          <StatCard 
            title="DEPENDENTS" 
            value={data.dependentsCount} 
            icon={HeartHandshake} 
            description={`Your Total Share: ${formattedUserTotalPayment} (${data.userTotalShares || 1} shares)`}
            className="bg-blue-50 border-blue-200"
          />
        </div>

        {/* Sadqa Wallet Card */}
        <div className="grid gap-4 md:grid-cols-1">
          <StatCard 
            title="SADQA WALLET" 
            value={formattedSadqaWallet} 
            icon={Coins} 
            description="Charitable donations up to $1,000 via Zelle"
            className="bg-green-50 border-green-200"
          />
        </div>

        {/* Latest Claims and Transparency */}
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
          <LatestClaimsCard />
          <TransparencyReportCard />
        </div>
      </main>
    </div>
  );
}
