'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, ShieldCheck, AlertCircle } from 'lucide-react';
import { updateTotalFunerals } from '@/lib/system-stats-actions';
import { canManageWalletPool } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

interface TotalFuneralsUpdateProps {
  currentCount: number;
  onUpdate: () => void;
}

export function TotalFuneralsUpdate({ currentCount, onUpdate }: TotalFuneralsUpdateProps) {
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newCount: currentCount.toString(),
    reason: ''
  });
  const { toast } = useToast();

  // Check if user can manage system stats (same permission as wallet pool)
  if (!canManageWalletPool(userProfile)) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newCount = parseInt(formData.newCount);
    if (isNaN(newCount) || newCount < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Count",
        description: "Please enter a valid positive number for the total funerals count.",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for updating the total funerals count.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateTotalFunerals(
        newCount,
        user.uid,
        user.displayName || 'Admin',
        formData.reason
      );

      if (result.success) {
        toast({
          title: "Total Funerals Updated",
          description: `Total funerals count updated to ${newCount}`,
        });
        
        // Reset form and close dialog
        setFormData({
          newCount: newCount.toString(),
          reason: ''
        });
        setOpen(false);
        onUpdate(); // Trigger parent refresh
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error updating total funerals:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred while updating the total funerals count.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        newCount: currentCount.toString(),
        reason: ''
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Update Count
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Update Total Funerals
          </DialogTitle>
          <DialogDescription>
            Update the total number of funerals conducted. This change will be reflected across all dashboards.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-count">Current Count</Label>
            <Input
              id="current-count"
              value={currentCount}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-count">New Count *</Label>
            <Input
              id="new-count"
              name="newCount"
              type="number"
              min="0"
              value={formData.newCount}
              onChange={handleInputChange}
              placeholder="0"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Update *</Label>
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="e.g., Funeral conducted, Correction to count, etc."
              rows={3}
              required
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This change will be immediately visible to all members and admins. 
              Please ensure the count is accurate.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Count'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
