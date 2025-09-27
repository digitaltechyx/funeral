'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submitClaim } from '@/lib/claim-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';

interface ClaimSubmissionFormProps {
  onSuccess?: () => void;
}

export function ClaimSubmissionForm({ onSuccess }: ClaimSubmissionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deathCertificateFile, setDeathCertificateFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a JPG, PNG, or PDF file.' });
      return;
    }

    // Compress image if it's an image file
    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      setMessage({ type: 'success', text: 'Compressing image...' });
      
      try {
        // Use more aggressive compression for larger files
        const maxSizeMB = file.size > 5 * 1024 * 1024 ? 0.3 : 0.5; // 0.3MB for files > 5MB, 0.5MB for others
        const maxWidthOrHeight = file.size > 10 * 1024 * 1024 ? 1280 : 1920; // Smaller max size for very large files
        
        console.log('Compression settings:', {
          originalSize: file.size,
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: maxWidthOrHeight
        });
        
        const compressedFile = await compressImage(file, {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: maxWidthOrHeight,
          useWebWorker: true
        });
        
        // Validate compressed file size (max 1MB)
        if (compressedFile.size > 1024 * 1024) {
          setMessage({ 
            type: 'error', 
            text: 'File is too large even after compression. Please choose a smaller image.' 
          });
          setIsCompressing(false);
          return;
        }
        
        setDeathCertificateFile(compressedFile);
        
        if (compressedFile.size < file.size) {
          const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
          setMessage({ 
            type: 'success', 
            text: `File compressed successfully! Size reduced by ${compressionRatio}%` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'File selected successfully. (Compression not needed, using original file)' 
          });
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        setMessage({ 
          type: 'error', 
          text: `Error compressing image: ${error instanceof Error ? error.message : 'Unknown error'}. Using original file.` 
        });
        // Fallback to original file if compression fails
        setDeathCertificateFile(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // For non-image files, validate size before setting
      if (file.size > 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 1MB.' });
        return;
      }
      
      setDeathCertificateFile(file);
      setMessage({ type: 'success', text: 'File selected successfully.' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append('memberId', user.uid);
      formData.append('memberName', user.displayName || '');
      formData.append('memberEmail', user.email || '');

      if (deathCertificateFile) {
        formData.set('deathCertificate', deathCertificateFile);
      }

      const result = await submitClaim(formData);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Reset form
        if (formRef.current) {
          formRef.current.reset();
        }
        setDeathCertificateFile(null);
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to submit a claim.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Funeral Claim</CardTitle>
        <CardDescription>
          Submit a claim for funeral assistance. All fields are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Deceased Person Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Deceased Person Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceasedName">Deceased Person Name *</Label>
                <Input
                  id="deceasedName"
                  name="deceasedName"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Deceased *</Label>
                <Select name="relationship" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Other Family">Other Family</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfDeath">Date of Death *</Label>
              <Input
                id="dateOfDeath"
                name="dateOfDeath"
                type="date"
                required
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Example Ave St."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Edison"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="New Jersey"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="08054"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                placeholder="USA"
                defaultValue="USA"
                required
              />
            </div>
          </div>

          {/* Death Certificate Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Death Certificate</h3>
            
            <div className="space-y-2">
              <Label htmlFor="deathCertificate">Death Certificate *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="deathCertificate"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                  required
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a JPG, PNG, or PDF file. Large images will be automatically compressed to fit within 1MB.
              </p>
            </div>

            {deathCertificateFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>File selected: {deathCertificateFile.name}</span>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional information or details..."
              rows={3}
            />
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Claim...
              </>
            ) : isCompressing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Compressing Image...
              </>
            ) : (
              'Submit Claim'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
