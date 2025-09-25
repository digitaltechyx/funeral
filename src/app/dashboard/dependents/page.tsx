import { Header } from "@/components/app/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { members } from "@/lib/data";
import { PlusCircle, AlertTriangle } from "lucide-react";

export default function UserDependentsPage() {
  const userDependents = members[0].dependents;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="My Dependents" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        {/* Important Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Important Notice</h3>
                <p className="text-sm text-orange-800 mt-1">
                  Please note: As the Head of Household, you are responsible for the funeral shares of all your dependents. 
                  Each dependent is counted as a full member when calculating contributions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Dependents</CardTitle>
              <CardDescription>Manage your dependents linked to your account.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Dependent</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a New Dependent</DialogTitle>
                  <DialogDescription>
                    Dependents are considered full members under your payment method.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dependent-name">Dependent's Full Name</Label>
                    <Input id="dependent-name" placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Input id="relationship" placeholder="Spouse, Son, Daughter..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Dependent</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dependent ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDependents.length > 0 ? (
                  userDependents.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="font-medium">{dep.id}</TableCell>
                      <TableCell>{dep.name}</TableCell>
                      <TableCell>{dep.relationship}</TableCell>
                      <TableCell>{dep.addedDate}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      You have not added any dependents.
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
