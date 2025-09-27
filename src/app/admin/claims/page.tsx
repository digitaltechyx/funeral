'use client';

import { useState, useEffect } from 'react';
import { getAllClaims, updateClaimStatus, deleteClaim } from '@/lib/claim-actions';
import { Claim } from '@/lib/database-schema';
import { Header } from '@/components/app/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const allClaims = await getAllClaims();
      setClaims(allClaims);
      setFilteredClaims(allClaims);
    } catch (error) {
      console.error('Error loading claims:', error);
      setMessage({ type: 'error', text: 'Failed to load claims. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [claims, searchTerm, statusFilter]);

  const filterClaims = () => {
    let filtered = claims;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.deceasedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    setFilteredClaims(filtered);
  };

  const handleStatusChange = async (claimId: string, newStatus: string) => {
    try {
      const result = await updateClaimStatus(claimId, newStatus as any);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadClaims();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      setMessage({ type: 'error', text: 'Failed to update claim status.' });
    }
  };

  const handleDeleteClaim = (claim: Claim) => {
    setClaimToDelete(claim);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClaim = async () => {
    if (!claimToDelete) return;

    try {
      setDeletingClaimId(claimToDelete.id);
      const result = await deleteClaim(claimToDelete.id);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        loadClaims();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error deleting claim:', error);
      setMessage({ type: 'error', text: 'Failed to delete claim.' });
    } finally {
      setDeletingClaimId(null);
      setIsDeleteDialogOpen(false);
      setClaimToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Paid':
        return <DollarSign className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Claims Management" />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Claims Management" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Claims Management</h1>
              <p className="text-muted-foreground">
                Manage and review all submitted funeral claims
              </p>
            </div>
            <Button onClick={loadClaims} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Message Display */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Search Claims</CardTitle>
              <CardDescription>Find specific claims by name, email, or status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by deceased name, member name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claims Table */}
          <Card>
            <CardHeader>
              <CardTitle>Claims Overview</CardTitle>
              <CardDescription>
                {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredClaims.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Claims Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No claims match your search criteria.' 
                      : 'No claims have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Deceased</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date of Death</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">
                            {claim.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{claim.memberName}</div>
                              <div className="text-sm text-muted-foreground">
                                {claim.memberEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {claim.deceasedName}
                          </TableCell>
                          <TableCell>
                            {claim.city}, {claim.state}
                          </TableCell>
                          <TableCell>
                            {format(claim.dateOfDeath, 'MM/dd/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(claim.status)}>
                              {getStatusIcon(claim.status)}
                              <span className="ml-1">{claim.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(claim.submissionDate, 'MM/dd/yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedClaim(claim);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Select
                                value={claim.status}
                                onValueChange={(newStatus) => handleStatusChange(claim.id, newStatus)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Approved">Approved</SelectItem>
                                  <SelectItem value="Paid">Paid</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClaim(claim)}
                                disabled={deletingClaimId === claim.id}
                              >
                                {deletingClaimId === claim.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claim Details Dialog */}
          {selectedClaim && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Claim Details</DialogTitle>
                  <DialogDescription>
                    Complete information for this funeral claim
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge className={getStatusColor(selectedClaim.status)}>
                      {getStatusIcon(selectedClaim.status)}
                      <span className="ml-1">{selectedClaim.status}</span>
                    </Badge>
                  </div>

                  {/* Deceased Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Deceased Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-sm">{selectedClaim.deceasedName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                        <p className="text-sm">{selectedClaim.relationship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Death</label>
                        <p className="text-sm">{format(selectedClaim.dateOfDeath, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Address Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm">{selectedClaim.address}</p>
                      <p className="text-sm">
                        {selectedClaim.city}, {selectedClaim.state} {selectedClaim.zipCode}
                      </p>
                      <p className="text-sm">{selectedClaim.country}</p>
                    </div>
                  </div>

                  {/* Death Certificate */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Death Certificate</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>File:</strong> {selectedClaim.deathCertificateFileName}
                      </p>
                      <p className="text-sm">
                        <strong>Size:</strong> {(selectedClaim.deathCertificateFileSize / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm">
                        <strong>Type:</strong> {selectedClaim.deathCertificateFileType}
                      </p>
                      {selectedClaim.deathCertificateURL && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedClaim.deathCertificateURL, '_blank')}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Death Certificate
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedClaim.notes && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Additional Notes</h3>
                      <p className="text-sm bg-muted p-3 rounded-md">{selectedClaim.notes}</p>
                    </div>
                  )}

                  {/* Submission Info */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Submission Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                        <p className="text-sm">{selectedClaim.memberName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{selectedClaim.memberEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submission Date</label>
                        <p className="text-sm">{format(selectedClaim.submissionDate, 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Claim</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this claim? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {claimToDelete && (
                  <div className="bg-muted p-4 rounded-md">
                    <p><strong>Deceased:</strong> {claimToDelete.deceasedName}</p>
                    <p><strong>Member:</strong> {claimToDelete.memberName}</p>
                    <p><strong>Status:</strong> {claimToDelete.status}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={deletingClaimId !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteClaim}
                    disabled={deletingClaimId !== null}
                  >
                    {deletingClaimId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Claim'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
