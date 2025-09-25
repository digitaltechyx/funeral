import { Header } from "@/components/app/header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { claims, members } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, BarChart3, FileText, Landmark, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { GenerateReportButton } from "@/components/app/admin/generate-report-button";

export default function AdminDashboardPage() {
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === "Active").length;
  const inactiveMembers = totalMembers - activeMembers;
  const pendingClaims = claims.filter(c => c.status === "Pending").length;
  const totalContributions = members.reduce((acc, member) => {
    return acc + member.paymentHistory.reduce((sum, p) => sum + p.amountDeducted, 0);
  }, 0);
  const totalPayouts = claims.filter(c => c.status === "Paid").length * 8000;
  const recentClaims = claims.slice(0, 5);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Admin Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StatCard title="Total Members" value={totalMembers} icon={Users} description={`${activeMembers} Active, ${inactiveMembers} Inactive`} />
          <StatCard title="Pending Claims" value={pendingClaims} icon={ShieldCheck} description="Awaiting review and approval" />
          <StatCard title="Total Contributions" value={`$${totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Landmark} description="Collected from all members" />
          <StatCard title="Total Payouts" value={`$${totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={BarChart3} description="Paid to claimants" />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription>
                  The 5 most recently submitted claims.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/admin/claims">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Deceased</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div className="font-medium">{claim.memberName}</div>
                        <div className="text-sm text-muted-foreground">{claim.memberId}</div>
                      </TableCell>
                      <TableCell>{claim.deceasedName}</TableCell>
                      <TableCell className="text-right">
                         <Badge 
                            variant={
                                claim.status === "Paid" ? "default" :
                                claim.status === "Approved" ? "secondary" :
                                claim.status === "Pending" ? "outline" :
                                "destructive"
                            }
                            className="capitalize"
                            style={claim.status === "Approved" ? {backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'} : {}}
                        >
                            {claim.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Transparency Tools</CardTitle>
              <CardDescription>
                Generate a summary of financial activities for all members. This promotes trust and transparency.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center gap-4 text-center">
               <div className="bg-primary/10 p-4 rounded-full">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground max-w-sm">
                The AI will analyze all audit logs to create a concise, human-readable report for the community.
              </p>
              <GenerateReportButton />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
