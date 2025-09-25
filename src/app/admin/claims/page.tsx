import { Header } from "@/components/app/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { claims } from "@/lib/data";
import { CheckCircle, MoreHorizontal, XCircle, FileDown, DollarSign } from "lucide-react";

export default function AdminClaimsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Claims Management" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        <Card>
          <CardHeader>
            <CardTitle>All Claims</CardTitle>
            <CardDescription>Review, approve, and process all submitted funeral claims.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Deceased</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.id}</TableCell>
                    <TableCell>
                      <div>{claim.memberName}</div>
                      <div className="text-sm text-muted-foreground">{claim.memberId}</div>
                    </TableCell>
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {claim.status === "Pending" && (
                            <>
                              <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Approve</DropdownMenuItem>
                              <DropdownMenuItem><XCircle className="mr-2 h-4 w-4 text-red-500" />Reject</DropdownMenuItem>
                            </>
                          )}
                          {claim.status === "Approved" && (
                             <DropdownMenuItem><DollarSign className="mr-2 h-4 w-4 text-green-500" />Charge Members</DropdownMenuItem>
                          )}
                          <DropdownMenuItem><FileDown className="mr-2 h-4 w-4" />Download Docs</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
