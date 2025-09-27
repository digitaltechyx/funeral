'use client';

import { useState, useEffect } from 'react';
import { getLatestClaim } from '@/lib/claim-actions';
import { Claim } from '@/lib/database-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, FileText, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export function LatestClaimsCard() {
  const [latestClaim, setLatestClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLatestClaim = async () => {
      try {
        setLoading(true);
        const claim = await getLatestClaim();
        setLatestClaim(claim);
      } catch (error) {
        console.error('Error loading latest claim:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLatestClaim();
  }, []);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Claim</CardTitle>
          <CardDescription>Most recently submitted funeral claim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestClaim) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Claim</CardTitle>
          <CardDescription>Most recently submitted funeral claim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Claims Yet</h3>
            <p className="text-muted-foreground mb-4">
              No funeral claims have been submitted yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/claims">
                View All Claims
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Claim</CardTitle>
        <CardDescription>Most recently submitted funeral claim</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Claim Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-lg">{latestClaim.deceasedName}</h3>
              <p className="text-sm text-muted-foreground">
                Submitted by {latestClaim.memberName}
              </p>
            </div>
            <Badge className={getStatusColor(latestClaim.status)}>
              {latestClaim.status}
            </Badge>
          </div>

          {/* Claim Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Date of Death: {format(latestClaim.dateOfDeath, 'MMM dd, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{latestClaim.city}, {latestClaim.state}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Relationship: {latestClaim.relationship}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Submitted: {format(latestClaim.submissionDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/dashboard/claims">
                View All Claims
              </Link>
            </Button>
            {latestClaim.deathCertificateURL && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(latestClaim.deathCertificateURL, '_blank')}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Certificate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
