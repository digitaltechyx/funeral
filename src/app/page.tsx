import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary p-3 rounded-full">
            <Handshake className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">Memorial Share Community</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Community-based memorial assistance for New Jersey. Supporting each other in times of need with transparency and trust.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Please select your portal to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/login" className="w-full">
              <Button size="lg" className="w-full text-lg py-7">
                <Handshake className="mr-2 h-5 w-5" /> Sign In / Sign Up
              </Button>
            </Link>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Join our community to support each other in times of need.
            </p>
          </CardContent>
        </Card>
      </div>
       <footer className="mt-12 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Memorial Share Community. All rights reserved.</p>
        <p className="text-sm">Built on trust and mutual support.</p>
      </footer>
    </main>
  );
}
