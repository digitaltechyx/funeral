import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Handshake } from "lucide-react";
import Link from "next/link";

export default function AddPaymentPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
       <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-3 rounded-full">
                <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">Almost there!</h1>
        <p className="mt-2 text-lg text-muted-foreground">Add a payment method to activate your membership.</p>
      </div>
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Add Payment Method</CardTitle>
          <CardDescription>Your card will be securely stored and only charged for community contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="card-name">Name on Card</Label>
              <Input id="card-name" placeholder="John M Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="•••• •••• •••• ••••" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry-date">Expires</Label>
                <Input id="expiry-date" placeholder="MM/YY" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="07001" required />
              </div>
            </div>
            <Link href="/dashboard" className="w-full">
                <Button type="submit" className="w-full mt-4" size="lg">
                    Activate Membership
                </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
