import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-3 rounded-full">
                <Handshake className="h-8 w-8 text-primary-foreground" />
            </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">Join Memorial Share</h1>
        <p className="mt-2 text-lg text-muted-foreground">Create your account to join our community.</p>
      </div>

      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>Enter your details below to create an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="John Doe" required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="(201) 555-0123" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Link href="/add-payment" className="w-full">
                <Button type="submit" className="w-full mt-4" size="lg">
                    Create Account & Continue
                </Button>
            </Link>
          </form>
           <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="underline text-primary/90 hover:text-primary font-medium">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
