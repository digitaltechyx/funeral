import { Header } from "@/components/app/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { members } from "@/lib/data";

export default function UserPaymentHistoryPage() {
  const userPayments = members[0].paymentHistory;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Payment History" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        <Card>
          <CardHeader>
            <CardTitle>My Contributions</CardTitle>
            <CardDescription>A record of all your contributions to the community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Funeral For</TableHead>
                  <TableHead>Funeral ID</TableHead>
                  <TableHead className="text-right">Amount Deducted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPayments.length > 0 ? (
                  userPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell className="font-medium">{payment.deceasedName}</TableCell>
                      <TableCell>{payment.funeralId}</TableCell>
                      <TableCell className="text-right">
                        -${payment.amountDeducted.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No payment history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
