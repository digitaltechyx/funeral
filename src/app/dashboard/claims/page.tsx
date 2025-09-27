'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClaimsByMember } from '@/lib/claim-actions';
import { Claim } from '@/lib/database-schema';
import { Header } from '@/components/app/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClaimSubmissionForm } from '@/components/claim-submission-form';
import { Plus, Eye, Calendar, MapPin, User, FileText, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function UserClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadClaims = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userClaims = await getClaimsByMember(user.uid);
      setClaims(userClaims);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [user]);

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

  const handleClaimSubmitted = () => {
    loadClaims();
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="My Claims" />
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
      <Header title="My Claims" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Claims</h1>
              <p className="text-muted-foreground">
                View and manage your submitted funeral claims
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Funeral Claim</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to submit a new funeral claim.
                  </DialogDescription>
                </DialogHeader>
                <ClaimSubmissionForm onSuccess={handleClaimSubmitted} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Claims List */}
          {claims.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Claims Submitted</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any funeral claims yet.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Your First Claim
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={loadClaims} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Claims Grid */}
              <div className="grid gap-4">
                {claims.map((claim) => (
                  <Card key={claim.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg">{claim.deceasedName}</CardTitle>
                          <CardDescription>
                            Submitted on {format(claim.submissionDate, 'MMM dd, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Date of Death: {format(claim.dateOfDeath, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{claim.city}, {claim.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Relationship: {claim.relationship}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Death Certificate: {claim.deathCertificateFileName}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Claim Details Dialog */}
          {selectedClaim && (
            <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
              <DialogContent className="max-w-2xl">
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
                      {selectedClaim.status}
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
        </div>
      </main>
    </div>
  );
}
