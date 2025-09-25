import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestTransparencyReport } from "@/lib/actions";
import { FileText } from "lucide-react";

export async function TransparencyReportCard() {
    const { summary } = await getLatestTransparencyReport();

    return (
        <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <FileText className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Community Transparency Report</CardTitle>
                </div>
                <CardDescription>
                    A comprehensive summary of our community's financial activities to ensure full transparency.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="prose prose-sm max-w-none text-foreground/90 p-4 border bg-secondary/50 rounded-lg h-full">
                    <p>{summary}</p>
                </div>
            </CardContent>
        </Card>
    );
}
