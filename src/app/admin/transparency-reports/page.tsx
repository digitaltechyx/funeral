'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/app/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, FileText, DollarSign, Receipt, Calendar, AlertCircle, Edit, Trash2, Eye, Upload, File } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from 'browser-image-compression';
import { getAllTransparencyReports, createTransparencyReport, uploadBillImages, updateTransparencyReport, deleteTransparencyReport } from '@/lib/firestore-service';
import { uploadWordDocument } from '@/lib/word-document-actions';

// Types
interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface TransparencyReport {
  id: string;
  title: string;
  message: string;
  totalExpenses: number;
  expenses: ExpenseItem[];
  billImages: string[];
  wordDocumentUrl?: string;
  createdBy: string;
  createdAt: string;
  status: 'Draft' | 'Published';
  claimId?: string;
}

// Form schema
const transparencyReportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  claimId: z.string().optional(),
});

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
});

type TransparencyReportForm = z.infer<typeof transparencyReportSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;

// Image compression options
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Maximum file size in MB
  maxWidthOrHeight: 1920, // Maximum width or height
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
};

export default function AdminTransparencyReportsPage() {
  const [reports, setReports] = useState<TransparencyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TransparencyReport | null>(null);
  const [currentExpenses, setCurrentExpenses] = useState<ExpenseItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{ [key: string]: number }>({});
  const [editingReport, setEditingReport] = useState<TransparencyReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [wordDocument, setWordDocument] = useState<File | null>(null);
  const [isUploadingWord, setIsUploadingWord] = useState(false);

  // Form for transparency report
  const reportForm = useForm<TransparencyReportForm>({
    resolver: zodResolver(transparencyReportSchema),
    defaultValues: {
      title: "",
      message: "",
      claimId: "",
    },
  });

  // Form for expenses
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "",
    },
  });

  // Load reports
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const reports = await getAllTransparencyReports();
      setReports(reports);
    } catch (error) {
      console.error('Error loading transparency reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = (data: ExpenseForm) => {
    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      description: data.description,
      amount: data.amount,
      category: data.category,
    };
    setCurrentExpenses([...currentExpenses, newExpense]);
    expenseForm.reset();
    setExpenseDialogOpen(false);
  };

  const handleRemoveExpense = (expenseId: string) => {
    setCurrentExpenses(currentExpenses.filter(exp => exp.id !== expenseId));
  };

  const resetForm = () => {
    reportForm.reset();
    setCurrentExpenses([]);
    setSelectedFiles([]);
    setCompressionProgress({});
    setEditingReport(null);
    setIsEditing(false);
    setExpenseDialogOpen(false);
    setWordDocument(null);
  };

  const handleWordDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
      alert('Please select a Word document (.docx or .doc file)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setWordDocument(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsCompressing(true);
    const files = Array.from(e.target.files);
    const compressedFiles: File[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        
        // Update progress for this file
        setCompressionProgress(prev => ({ ...prev, [fileName]: 0 }));

        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await imageCompression(file, {
              ...IMAGE_COMPRESSION_OPTIONS,
              onProgress: (progress) => {
                setCompressionProgress(prev => ({ ...prev, [fileName]: progress }));
              }
            });
            compressedFiles.push(compressedFile);
          } catch (error) {
            console.error(`Error compressing ${fileName}:`, error);
            // If compression fails, use original file
            compressedFiles.push(file);
          }
        } else {
          // For PDFs and other non-image files, add as-is
          compressedFiles.push(file);
        }
      }

      setSelectedFiles(compressedFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      setSelectedFiles(files); // Fallback to original files
    } finally {
      setIsCompressing(false);
      setCompressionProgress({});
    }
  };

  // Helper function to remove undefined values from objects
  const removeUndefinedValues = (obj: any) => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  const handleSubmitReport = async (data: TransparencyReportForm) => {
    try {
      console.log('Starting report submission...', data);
      setIsSubmitting(true);
      
      const totalExpenses = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log('Total expenses:', totalExpenses);
      console.log('Current expenses:', currentExpenses);
      
      // Upload bill images if any
      let billImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        console.log('Uploading bill images...', selectedFiles.length);
        const reportId = Date.now().toString(); // Temporary ID for file upload
        billImageUrls = await uploadBillImages(selectedFiles, reportId);
        console.log('Bill images uploaded:', billImageUrls);
      }
      
      // Upload Word document if any
      let wordDocumentUrl: string | undefined;
      if (wordDocument) {
        console.log('Uploading Word document...');
        setIsUploadingWord(true);
        const reportId = Date.now().toString(); // Temporary ID for file upload
        const uploadResult = await uploadWordDocument(wordDocument, reportId);
        
        if (uploadResult.success && uploadResult.url) {
          wordDocumentUrl = uploadResult.url;
          console.log('Word document uploaded successfully:', wordDocumentUrl);
        } else {
          console.error('Failed to upload Word document:', uploadResult.error);
          alert('Failed to upload Word document. Please try again.');
          return;
        }
        setIsUploadingWord(false);
      }
      
      if (isEditing && editingReport) {
        // Update existing report
        console.log('Updating existing report...', editingReport.id);
        const updateData = removeUndefinedValues({
          title: data.title,
          message: data.message,
          claimId: data.claimId || null,
          expenses: currentExpenses,
          totalExpenses,
          billImageUrls: billImageUrls.length > 0 ? billImageUrls : editingReport.billImageUrls,
          wordDocumentUrl: wordDocumentUrl || editingReport.wordDocumentUrl,
        });
        
        await updateTransparencyReport(editingReport.id, updateData);
        console.log('Transparency report updated:', editingReport.id);
      } else {
        // Create new report
        console.log('Creating new report...');
        const createData = removeUndefinedValues({
          title: data.title,
          message: data.message,
          claimId: data.claimId || null,
          expenses: currentExpenses,
          totalExpenses,
          billImageUrls,
          wordDocumentUrl: wordDocumentUrl || null,
          createdBy: 'Admin' // TODO: Get from auth context
        });
        
        console.log('Create data:', createData);
        const reportId = await createTransparencyReport(createData);
        console.log('Transparency report created with ID:', reportId);
      }
      
      // Reload reports to show the changes
      console.log('Reloading reports...');
      await loadReports();
      
      // Reset form and close dialog
      resetForm();
      setDialogOpen(false);
      console.log('Report submission completed successfully');
    } catch (error) {
      console.error('Error saving transparency report:', error);
      alert('Failed to save transparency report. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingWord(false);
    }
  };

  const handleEditReport = (report: TransparencyReport) => {
    setEditingReport(report);
    setIsEditing(true);
    setCurrentExpenses(report.expenses || []);
    setSelectedFiles([]); // Clear selected files for edit
    setExpenseDialogOpen(false); // Close expense dialog
    reportForm.reset({
      title: report.title,
      message: report.message,
      claimId: report.claimId || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this transparency report? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingId(reportId);
      await deleteTransparencyReport(reportId);
      console.log('Transparency report deleted:', reportId);
      await loadReports(); // Reload reports
    } catch (error) {
      console.error('Error deleting transparency report:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: TransparencyReport['status']) => {
    if (status === 'Published') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transparency Reports</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage transparency reports for funeral expenses and community updates.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                console.log('Create Report button clicked');
                console.log('Dialog open state:', dialogOpen);
                setDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Transparency Report' : 'Create Transparency Report'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update the transparency report with expenses and bill documentation.' : 'Add a new transparency report with expenses and bill documentation.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={reportForm.handleSubmit((data) => {
                console.log('Form submitted with data:', data);
                console.log('Form errors:', reportForm.formState.errors);
                handleSubmitReport(data);
              })} className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Report Title</Label>
                    <Input
                      id="title"
                      {...reportForm.register("title")}
                      placeholder="e.g., John Doe Funeral Expenses Report"
                    />
                    {reportForm.formState.errors.title && (
                      <p className="text-sm text-red-600 mt-1">
                        {reportForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="claimId">Claim ID (Optional)</Label>
                    <Input
                      id="claimId"
                      {...reportForm.register("claimId")}
                      placeholder="Associated claim ID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message to Community</Label>
                    <Textarea
                      id="message"
                      {...reportForm.register("message")}
                      placeholder="Provide a detailed message about the expenses and transparency..."
                      rows={4}
                    />
                    {reportForm.formState.errors.message && (
                      <p className="text-sm text-red-600 mt-1">
                        {reportForm.formState.errors.message.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Expenses</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setExpenseDialogOpen(!expenseDialogOpen)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>

                  {/* Inline Expense Form */}
                  {expenseDialogOpen && (
                    <div className="border rounded-lg p-4 mb-4 bg-muted/50">
                      <h4 className="font-semibold mb-3">Add New Expense</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="expense-description">Description</Label>
                            <Input
                              id="expense-description"
                              {...expenseForm.register("description")}
                              placeholder="e.g., Funeral Home Services"
                            />
                          </div>
                          <div>
                            <Label htmlFor="expense-amount">Amount ($)</Label>
                            <Input
                              id="expense-amount"
                              type="number"
                              step="0.01"
                              {...expenseForm.register("amount", { valueAsNumber: true })}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="expense-category">Category</Label>
                            <Input
                              id="expense-category"
                              {...expenseForm.register("category")}
                              placeholder="e.g., Service, Product, Transportation"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={expenseForm.handleSubmit(handleAddExpense)}
                          >
                            Add Expense
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setExpenseDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentExpenses.length > 0 ? (
                    <div className="space-y-2">
                      {currentExpenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">{expense.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">${expense.amount.toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveExpense(expense.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right border-t pt-2">
                        <p className="text-lg font-bold">
                          Total: ${currentExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No expenses added yet</p>
                  )}
                </div>

                {/* Word Document Upload */}
                <div>
                  <Label htmlFor="wordDocument">Word Document Report (Optional)</Label>
                  <Input
                    id="wordDocument"
                    type="file"
                    accept=".docx,.doc"
                    onChange={handleWordDocumentChange}
                    className="mt-1"
                    disabled={isUploadingWord}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a Word document report (e.g., downloaded from Charging Reports). Max size: 10MB.
                  </p>
                  
                  {wordDocument && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">{wordDocument.name}</span>
                        <span className="text-xs text-green-600">
                          ({(wordDocument.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill Images */}
                <div>
                  <Label htmlFor="billImages">Bill Images / Receipts (Optional)</Label>
                  <Input
                    id="billImages"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="mt-1"
                    disabled={isCompressing}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload bill images or PDF receipts to support your expense report. Images will be automatically compressed to max 1MB each.
                  </p>
                  
                  {/* Compression Progress */}
                  {isCompressing && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Compressing images...</span>
                      </div>
                      {Object.entries(compressionProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="mb-1">
                          <div className="flex justify-between text-xs text-blue-700 mb-1">
                            <span>{fileName}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && !isCompressing && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Selected files ({selectedFiles.length}):</p>
                      <ul className="text-sm text-muted-foreground">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <span>• {file.name}</span>
                            <span className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                              {file.type.startsWith('image/') && file.size <= 1024 * 1024 && (
                                <span className="text-green-600 ml-1">✓ Compressed</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isCompressing}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isCompressing ? 'Compressing...' : (isEditing ? 'Update Report' : 'Publish Report')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Published Reports
              </CardTitle>
              <CardDescription>
                All transparency reports published to the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first transparency report to share with the community.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Total Expenses</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {report.totalExpenses.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>{report.createdAt}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditReport(report)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              disabled={deletingId === report.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Details Dialog */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedReport.title}</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  Created on {selectedReport.createdAt} • {getStatusBadge(selectedReport.status)}
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Message</h3>
                  <p className="text-muted-foreground">{selectedReport.message}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Expense Breakdown</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.expenses && selectedReport.expenses.length > 0 ? (
                          selectedReport.expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell>{expense.category}</TableCell>
                              <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No expenses recorded
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">${selectedReport.totalExpenses?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {selectedReport.wordDocumentUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Word Document Report</h3>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">Charging Report Document</p>
                          <p className="text-sm text-blue-600">Download the detailed Word report</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(selectedReport.wordDocumentUrl, '_blank')}
                          className="ml-auto"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.billImageUrls && selectedReport.billImageUrls.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Bill Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReport.billImageUrls.map((imageUrl, index) => (
                        <div key={index} className="border rounded-lg p-2">
                          <img 
                            src={imageUrl} 
                            alt={`Bill ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-32 items-center justify-center bg-muted rounded">
                            <Receipt className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-center mt-1 ml-2">Bill {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}