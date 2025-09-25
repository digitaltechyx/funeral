import { Header } from "@/components/app/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { members } from "@/lib/data";
import { PlusCircle } from "lucide-react";

export default function UserClaimsPage() {
  const userClaims = members[0].claims;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="My Claims" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Submitted Claims</CardTitle>
              <CardDescription>Track the status of your submitted claims.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Submit New Claim</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit a New Claim</DialogTitle>
                  <DialogDescription>
                    Please provide the details for the funeral claim. Our team will review it shortly.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deceased-name">Deceased's Full Name</Label>
                    <Input id="deceased-name" placeholder="Jane Doe" />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="date-of-death">Date of Death</Label>
                    <Input id="date-of-death" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="death-certificate">Proof of Death (e.g., Death Certificate)</Label>
                    <Input id="death-certificate" type="file" />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" placeholder="Any additional information..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Submit for Review</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Deceased</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userClaims.length > 0 ? (
                  userClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell>{claim.deceasedName}</TableCell>
                      <TableCell>{claim.submissionDate}</TableCell>
                      <TableCell>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      You have not submitted any claims.
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
