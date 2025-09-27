'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Download, Receipt, Calendar, DollarSign } from 'lucide-react';
import { getMemberPaymentHistory } from '@/lib/payment-actions';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecord {
  id: string;
  amount: number;
  shares: number;
  amountPerShare: number;
  date: string;
  type: string;
  status: string;
  paymentIntentId: string;
}

export default function PaymentHistoryPage() {
  const { user, userProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const paymentHistory = await getMemberPaymentHistory(user?.uid || '');
      setPayments(paymentHistory);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payment history.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'funeral_share':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Funeral Share</Badge>;
      case 'sadqa_donation':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Sadqa Donation</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Share History" />
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
      <Header title="Share History" />
      <main className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8 bg-background">

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Share History
            </CardTitle>
            <CardDescription>
              View all your share transactions and download invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Payments Yet</h3>
                <p className="text-muted-foreground">
                  Your share history will appear here once you make contributions.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(payment.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(payment.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">${payment.amount.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.shares} share{payment.shares !== 1 ? 's' : ''}
                        {payment.amountPerShare && (
                          <div className="text-xs text-muted-foreground">
                            @ ${payment.amountPerShare.toFixed(2)} each
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement invoice download
                            toast({
                              title: "Invoice Download",
                              description: "Invoice download feature coming soon.",
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Important information about how payments work in our community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Funeral Share Payments</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Each member pays $8 per share</li>
                  <li>• You pay for yourself + your dependents</li>
                  <li>• Payments are charged when a funeral occurs</li>
                  <li>• All payments go to the community wallet pool</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Payment Methods</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We accept all major credit cards</li>
                  <li>• Payments are processed securely via Stripe</li>
                  <li>• You can update your payment method anytime</li>
                  <li>• Invoices are provided for all transactions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}