"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Calendar, DollarSign, ChevronDown, ChevronUp, Eye, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTransparencyReports } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: 'Service' | 'Product' | 'Transportation' | 'Other';
}

interface TransparencyReport {
  id: string;
  title: string;
  message: string;
  totalExpenses: number;
  createdAt: string;
  status: 'Draft' | 'Published';
  expenses?: ExpenseItem[];
  billImageUrls?: string[];
  claimId?: string;
}

export function TransparencyReportCard() {
    const [reports, setReports] = useState<TransparencyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [selectedReport, setSelectedReport] = useState<TransparencyReport | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        const loadReports = async () => {
            try {
                setLoading(true);
                const allReports = await getAllTransparencyReports();
                // Filter only published reports
                const publishedReports = allReports.filter(report => report.status === 'Published');
                setReports(publishedReports);
            } catch (error) {
                console.error('Error loading transparency reports:', error);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, []);

    const handleViewDetails = (report: TransparencyReport) => {
        setSelectedReport(report);
        setDetailsOpen(true);
    };

    const displayedReports = showAll ? reports : reports.slice(0, 1);

    return (
        <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <FileText className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Community Transparency Reports</CardTitle>
                </div>
                <CardDescription>
                    A comprehensive summary of our community's financial activities to ensure full transparency.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading reports...</span>
                        </div>
                    ) : reports.length > 0 ? (
                        <>
                            {displayedReports.map((report, index) => (
                                <div key={report.id} className="prose prose-sm max-w-none text-foreground/90 p-4 border bg-secondary/50 rounded-lg">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg">{report.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {report.createdAt}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    ${report.totalExpenses.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm leading-relaxed">{report.message}</p>
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(report)}
                                                className="flex items-center gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {reports.length > 1 && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAll(!showAll)}
                                        className="flex items-center gap-2"
                                    >
                                        {showAll ? (
                                            <>
                                                <ChevronUp className="h-4 w-4" />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4" />
                                                Show All Reports ({reports.length})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No Reports Available</h3>
                            <p className="text-sm text-muted-foreground">
                                Transparency reports will appear here when published by administrators.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
            
            {/* Detailed Report Modal */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedReport?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Complete transparency report with all expenses and supporting documents
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedReport && (
                        <div className="space-y-6">
                            {/* Report Overview */}
                            <div className="bg-secondary/50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {selectedReport.createdAt}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" />
                                            Total: ${selectedReport.totalExpenses.toFixed(2)}
                                        </div>
                                        {selectedReport.claimId && (
                                            <Badge variant="outline">Claim ID: {selectedReport.claimId}</Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed">{selectedReport.message}</p>
                            </div>

                            {/* Expenses Breakdown */}
                            {selectedReport.expenses && selectedReport.expenses.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <Receipt className="h-5 w-5" />
                                        Expense Breakdown
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedReport.expenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/30">
                                                <div className="flex-1">
                                                    <p className="font-medium">{expense.description}</p>
                                                    <Badge variant="secondary" className="mt-1">
                                                        {expense.category}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bill Images */}
                            {selectedReport.billImageUrls && selectedReport.billImageUrls.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <Receipt className="h-5 w-5" />
                                        Supporting Documents
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedReport.billImageUrls.map((imageUrl, index) => (
                                            <div key={index} className="border rounded-lg overflow-hidden">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Bill document ${index + 1}`}
                                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = `
                                                            <div class="flex items-center justify-center h-48 bg-secondary/30">
                                                                <div class="text-center">
                                                                    <Receipt class="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                                                    <p class="text-sm text-muted-foreground">Document ${index + 1}</p>
                                                                    <a href="${imageUrl}" target="_blank" class="text-primary hover:underline text-xs">View Document</a>
                                                                </div>
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No expenses message */}
                            {(!selectedReport.expenses || selectedReport.expenses.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Receipt className="h-12 w-12 mx-auto mb-4" />
                                    <p>No detailed expenses recorded for this report.</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
