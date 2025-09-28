'use client';

import { useState, useEffect } from 'react';
import { getAllClaims, submitClaim } from '@/lib/claim-actions';
import { Claim } from '@/lib/database-schema';
import { useAuth } from '@/contexts/AuthContext';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  RefreshCw,
  Loader2,
  FileText,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Plus,
  Upload
} from 'lucide-react';

// Helper function to format dates safely
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date && typeof date === 'object' && date.seconds) {
      // Firebase Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else {
      return 'N/A';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error, date);
    return 'N/A';
  }
};

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  
  // Form state for submitting claims
  const [formData, setFormData] = useState({
    deceasedName: '',
    address: '',
    city: '',
    zipCode: '',
    state: '',
    country: 'USA',
    dateOfDeath: '',
    notes: '',
    deathCertificate: null as File | null
  });

  const loadClaims = async () => {
    try {
      setLoading(true);
      const allClaims = await getAllClaims();
      // Sort by submission date (newest first) and limit to 10
      const sortedClaims = allClaims
        .sort((a, b) => {
          const dateA = a.submissionDate?.toDate?.() || new Date(a.submissionDate || 0);
          const dateB = b.submissionDate?.toDate?.() || new Date(b.submissionDate || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
      setClaims(sortedClaims);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setProcessingFile(true);
        setSubmitMessage(null);
        
        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          // Compress image if it's larger than 1MB
          if (file.size > 1024 * 1024) {
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true
            });
            setFormData(prev => ({
              ...prev,
              deathCertificate: compressedFile
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              deathCertificate: file
            }));
          }
        } else if (file.type === 'application/pdf') {
          // For PDF files, check size but don't compress
          if (file.size > 1024 * 1024) {
            setSubmitMessage({ type: 'error', text: 'PDF file size must be less than 1MB.' });
            return;
          }
          setFormData(prev => ({
            ...prev,
            deathCertificate: file
          }));
        } else {
          setSubmitMessage({ type: 'error', text: 'Please upload a valid image (JPG, PNG) or PDF file.' });
          return;
        }
        
      } catch (error) {
        console.error('Error processing file:', error);
        setSubmitMessage({ type: 'error', text: 'Error processing file. Please try again.' });
      } finally {
        setProcessingFile(false);
      }
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deathCertificate) {
      setSubmitMessage({ type: 'error', text: 'Death certificate is required.' });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage(null);
      
      // Create FormData object as expected by submitClaim function
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('deceasedName', formData.deceasedName);
      formDataToSubmit.append('address', formData.address);
      formDataToSubmit.append('city', formData.city);
      formDataToSubmit.append('zipCode', formData.zipCode);
      formDataToSubmit.append('state', formData.state);
      formDataToSubmit.append('country', formData.country);
      formDataToSubmit.append('relationship', 'Family Member'); // Default relationship
      formDataToSubmit.append('dateOfDeath', formData.dateOfDeath);
      formDataToSubmit.append('notes', formData.notes);
      formDataToSubmit.append('memberId', user?.uid || '');
      formDataToSubmit.append('memberName', user?.displayName || user?.email || 'Unknown User');
      formDataToSubmit.append('memberEmail', user?.email || '');
      formDataToSubmit.append('deathCertificate', formData.deathCertificate);

      const result = await submitClaim(formDataToSubmit);

      if (result.success) {
        setSubmitMessage({ type: 'success', text: 'Claim submitted successfully!' });
        // Reset form
        setFormData({
          deceasedName: '',
          address: '',
          city: '',
          zipCode: '',
          state: '',
          country: 'USA',
          dateOfDeath: '',
          notes: '',
          deathCertificate: null
        });
        // Close dialog after a delay
        setTimeout(() => {
          setIsSubmitDialogOpen(false);
          loadClaims(); // Reload claims to show the new one
        }, 2000);
      } else {
        setSubmitMessage({ type: 'error', text: result.message || 'Failed to submit claim.' });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to submit claim. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading claims...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Claims</h1>
          <p className="text-muted-foreground">
            View all submitted claims in our community
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit New Claim</DialogTitle>
                <DialogDescription>
                  Please provide all required information for the funeral claim
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deceasedName">Deceased Person Name *</Label>
                    <Input
                      id="deceasedName"
                      name="deceasedName"
                      value={formData.deceasedName}
                      onChange={handleInputChange}
                      placeholder="Enter deceased person's full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfDeath">Date of Death *</Label>
                    <Input
                      id="dateOfDeath"
                      name="dateOfDeath"
                      type="date"
                      value={formData.dateOfDeath}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="Zip code"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deathCertificate">Death Certificate *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="deathCertificate"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="flex-1"
                      required
                      disabled={processingFile}
                    />
                    {processingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload death certificate (PDF or image, max 1MB)
                    {processingFile && <span className="text-blue-600"> - Processing file...</span>}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information or notes..."
                    rows={3}
                  />
                </div>
                
                {submitMessage && (
                  <div className={`p-3 rounded-md ${
                    submitMessage.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {submitMessage.text}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmitDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Claim'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={loadClaims}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No claims found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
            <div>
                      <CardTitle className="text-lg">{claim.deceasedName}</CardTitle>
                      <CardDescription>
                        Submitted by {claim.memberName}
                      </CardDescription>
                    </div>
            </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Badge>
                    <Dialog open={isDialogOpen && selectedClaim?.id === claim.id} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                </Button>
              </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                          <DialogTitle>Claim Details</DialogTitle>
                  <DialogDescription>
                            Complete information about this claim
                  </DialogDescription>
                </DialogHeader>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Deceased Person:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.deceasedName}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Date of Death:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{formatDate(claim.dateOfDeath)}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Address:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.address}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">City:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.city}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">State:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.state}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Zip Code:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.zipCode}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Country:</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6">{claim.country}</p>
                            </div>
                          </div>
                          
                          {claim.notes && (
                            <div className="space-y-2">
                              <span className="font-medium">Notes:</span>
                              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                                {claim.notes}
                              </p>
                            </div>
                          )}
                          
                          {claim.deathCertificateURL && (
                            <div className="space-y-2">
                              <span className="font-medium">Death Certificate:</span>
                              <div className="mt-2">
                                <img
                                  src={claim.deathCertificateURL}
                                  alt="Death Certificate"
                                  className="max-w-full h-auto rounded-md border"
                                  style={{ maxHeight: '400px' }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Submitted on {formatDate(claim.submissionDate)}
                  </div>
                            <Badge className={getStatusColor(claim.status)}>
                              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                            </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
                  </div>
                </div>
          </CardHeader>
          <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date of Death:</span>
                    <p className="text-muted-foreground">{formatDate(claim.dateOfDeath)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="text-muted-foreground">{claim.city}, {claim.state}</p>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <p className="text-muted-foreground">{formatDate(claim.submissionDate)}</p>
                  </div>
                </div>
          </CardContent>
        </Card>
          ))}
        </div>
      )}
    </div>
  );
}
