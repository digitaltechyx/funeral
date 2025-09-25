import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Claim } from "@/lib/data";
import { Calendar, User, UserCheck } from "lucide-react";

type LatestClaimsCardProps = {
    claim: Claim;
};

export function LatestClaimsCard({ claim }: LatestClaimsCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Latest Community Funeral</CardTitle>
                <CardDescription>In remembrance and support of our community member.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-accent/20 p-3 rounded-full">
                            <User className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">In Memory Of</p>
                            <p className="text-xl font-semibold font-headline">{claim.deceasedName}</p>
                        </div>
                    </div>
                    
                    <Separator className="my-4" />

                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span>Member: <span className="font-medium">{claim.memberName}</span> ({claim.memberId})</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Funeral Date: <span className="font-medium">{claim.funeralDate}</span></span>
                        </li>
                    </ul>
                </div>
                
                 <div className="mt-6">
                    <Badge 
                        className="text-sm py-1 px-3 capitalize" 
                        style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}
                    >
                        {claim.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
