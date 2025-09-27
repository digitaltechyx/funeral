'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, DollarSign, AlertCircle } from 'lucide-react';
import { updateWalletPool } from '@/lib/wallet-pool-actions';
import { canManageWalletPool } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

interface WalletPoolUpdateProps {
  currentBalance: number;
  onUpdate: () => void;
}

export function WalletPoolUpdate({ currentBalance, onUpdate }: WalletPoolUpdateProps) {
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newBalance: currentBalance.toString(),
    reason: ''
  });
  const { toast } = useToast();

  // Check if user can manage wallet pool
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

    const newBalance = parseFloat(formData.newBalance);
    if (isNaN(newBalance) || newBalance < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive number for the wallet pool balance.",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for updating the wallet pool balance.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateWalletPool(
        newBalance,
        user.uid,
        user.displayName || 'Admin',
        formData.reason
      );

      if (result.success) {
        toast({
          title: "Wallet Pool Updated",
          description: `Wallet pool balance updated to $${newBalance.toFixed(2)}`,
        });
        
        // Reset form and close dialog
        setFormData({
          newBalance: newBalance.toString(),
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
      console.error('Error updating wallet pool:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred while updating the wallet pool.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        newBalance: currentBalance.toString(),
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
          Update Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Update Wallet Pool
          </DialogTitle>
          <DialogDescription>
            Update the wallet pool balance. This change will be reflected across all dashboards.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-balance">Current Balance</Label>
            <Input
              id="current-balance"
              value={`$${currentBalance.toFixed(2)}`}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-balance">New Balance *</Label>
            <Input
              id="new-balance"
              name="newBalance"
              type="number"
              step="0.01"
              min="0"
              value={formData.newBalance}
              onChange={handleInputChange}
              placeholder="0.00"
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
              placeholder="e.g., Withdrawal for funeral payout, New collection, etc."
              rows={3}
              required
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This change will be immediately visible to all members and admins. 
              Please ensure the amount is accurate.
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
                'Update Balance'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
