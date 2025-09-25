import { Header } from "@/components/app/header";
import { LatestClaimsCard } from "@/components/app/dashboard/latest-claims-card";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { TransparencyReportCard } from "@/components/app/dashboard/transparency-report-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";
import { Users, HeartHandshake, CircleDollarSign, ShieldCheck, CheckCircle, Building2, Coins } from "lucide-react";
import { Suspense } from "react";

export default function DashboardPage() {
    const data = getDashboardData();
    const formattedShare = `$${data.eachShareAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedPayout = `$${data.maxPayout.toLocaleString('en-US')}`;
    const formattedWalletPool = `$${data.walletPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedSadqaWallet = `$${data.sadqaWallet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header title="My Dashboard" />
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
                                    Congratulations! Memorial Share has reached {data.activeMembers} members
                                </h2>
                            </div>
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 font-semibold">
                                    To officially begin the funeral assistance, we need 1,000 active members.
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
                                               When a funeral occurs, the <span className="font-bold text-green-600">$8,000 funeral cost</span> is divided equally among all active members. 
                                               For example, with {data.activeMembers} active members, each person contributes ${formattedShare} per funeral.
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
                        title="MEMBERS" 
                        value={data.totalMembers} 
                        icon={Users} 
                        description="Total register members"
                        className="bg-blue-50 border-blue-200"
                    />
                    <StatCard 
                        title="JANAZAH" 
                        value={data.totalFunerals} 
                        icon={ShieldCheck} 
                        description="Total Janazah conducted so far"
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
                        description="1.062 Funeral Can Cover"
                        className="bg-purple-50 border-purple-200"
                    />
                    <StatCard 
                        title="DEPENDENTS" 
                        value={data.dependentsCount} 
                        icon={HeartHandshake} 
                        description={`Your Total Share ${formattedShare}`}
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
                    <LatestClaimsCard claim={data.latestClaim} />
                    <Suspense fallback={<Card className="lg:col-span-2"><CardContent>Loading report...</CardContent></Card>}>
                        <TransparencyReportCard />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
