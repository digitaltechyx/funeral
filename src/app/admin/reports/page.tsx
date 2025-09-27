import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getChargingReports } from "@/lib/payment-actions";
import { CheckCircle, XCircle, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";

export default async function AdminReportsPage() {
  const reports = await getChargingReports();
  const { successfulPayments, failedPayments, statistics } = reports;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charging Reports</h1>
          <p className="text-muted-foreground">
            Detailed reports on member charging activities and payment status
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Successful Charges</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalMembersCharged}</div>
              <p className="text-xs text-muted-foreground">
                ${statistics.totalSuccessfulAmount.toFixed(2)} collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Charges</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalMembersFailed}</div>
              <p className="text-xs text-muted-foreground">
                ${statistics.totalFailedAmount.toFixed(2)} lost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Payment success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.totalSuccessfulAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From successful charges
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Successful Charges Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Successful Charges
            </CardTitle>
            <CardDescription>
              Members who were successfully charged for memorial contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successfulPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Amount per Share</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Charged At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {successfulPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.memberName}</TableCell>
                      <TableCell>{payment.memberEmail}</TableCell>
                      <TableCell>${payment.amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{payment.shares || 1}</TableCell>
                      <TableCell>${payment.amountPerShare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.paymentIntentId?.slice(-8) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {payment.chargedAt ? 
                          new Date(payment.chargedAt.seconds * 1000).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p>No successful charges recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Charges Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Failed Charges
            </CardTitle>
            <CardDescription>
              Members who could not be charged and require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {failedPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Amount per Share</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempted At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.memberName}</TableCell>
                      <TableCell>{payment.memberEmail}</TableCell>
                      <TableCell>${payment.amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{payment.shares || 1}</TableCell>
                      <TableCell>${payment.amountPerShare?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-red-600 text-sm">
                        {payment.error || 'Unknown error'}
                      </TableCell>
                      <TableCell>
                        {payment.chargedAt ? 
                          new Date(payment.chargedAt.seconds * 1000).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          Failed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <p>No failed charges recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Required Alert */}
        {failedPayments.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Action Required
              </CardTitle>
              <CardDescription className="text-red-700">
                {failedPayments.length} member(s) could not be charged. Please review the failed charges above and take appropriate action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-700">
                <p className="font-medium">Recommended actions:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Contact members with failed payments to update their payment methods</li>
                  <li>Verify payment method validity in Stripe dashboard</li>
                  <li>Retry charging after payment method updates</li>
                  <li>Consider alternative payment arrangements for persistent failures</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
