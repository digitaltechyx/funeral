"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/app/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllMembers, getAllDependents, getUserDependents } from "@/lib/firestore-service";
import { Calendar, Users, Eye, Loader2, Phone, Mail, MapPin, User } from "lucide-react";

interface MemberDetails {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: string;
  role: string;
  walletBalance: number;
  sadqaWallet: number;
  hasPaymentMethod: boolean;
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
    isPrimary: boolean;
  }>;
  dependents: Array<{
    id: string;
    name: string;
    relationship: string;
    addedDate: string;
  }>;
}

export default function AdminMembersPage() {
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [allDependents, setAllDependents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [members, dependents] = await Promise.all([
          getAllMembers(),
          getAllDependents()
        ]);
        setAllMembers(members);
        setAllDependents(dependents);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group dependents by memberId
  const dependentsByMember = allDependents.reduce((acc, dependent) => {
    if (!acc[dependent.memberId]) {
      acc[dependent.memberId] = [];
    }
    acc[dependent.memberId].push(dependent);
    return acc;
  }, {} as Record<string, typeof allDependents>);

  const handleMemberClick = async (member: any) => {
    try {
      setLoadingMemberDetails(true);
      setDialogOpen(true);
      
      // Fetch member's dependents
      const memberDependents = await getUserDependents(member.id);
      
      const memberDetails: MemberDetails = {
        id: member.id,
        name: member.name,
        email: member.email,
        joinDate: member.joinDate,
        status: member.status,
        role: member.role,
        walletBalance: member.walletBalance || 0,
        sadqaWallet: member.sadqaWallet || 0,
        hasPaymentMethod: member.hasPaymentMethod || false,
        emergencyContacts: member.emergencyContacts || [],
        dependents: memberDependents.map(dep => ({
          id: dep.id,
          name: dep.name,
          relationship: dep.relationship,
          addedDate: dep.addedDate
        }))
      };
      
      setSelectedMember(memberDetails);
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoadingMemberDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header title="Member Management" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading members...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Member Management" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background">
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>View and manage all members of the community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Dependents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMembers.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleMemberClick(member)}
                  >
                    <TableCell className="font-medium">{member.id}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {member.joinDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {dependentsByMember[member.id]?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={member.status === 'Active' ? 'default' : 'destructive'}
                        className="capitalize"
                        style={member.status === 'Active' ? {backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'} : {}}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberClick(member);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {allMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Member Details Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>
                Complete information about {selectedMember?.name}
              </DialogDescription>
            </DialogHeader>
            
            {loadingMemberDetails ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedMember ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member ID</label>
                      <p className="font-mono text-sm">{selectedMember.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="font-medium">{selectedMember.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedMember.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {selectedMember.joinDate}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge 
                        variant={selectedMember.status === 'Active' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {selectedMember.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <Badge variant="outline" className="capitalize">
                        {selectedMember.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sadqa Wallet</label>
                      <p className="text-lg font-semibold">${selectedMember.sadqaWallet.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dependents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Dependents ({selectedMember.dependents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMember.dependents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedMember.dependents.map((dependent) => (
                          <div key={dependent.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{dependent.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Relationship: {dependent.relationship}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Added: {dependent.addedDate}
                                </p>
                              </div>
                              <Badge variant="outline">Dependent</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No dependents added</p>
                    )}
                  </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Emergency Contacts ({selectedMember.emergencyContacts?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMember.emergencyContacts && selectedMember.emergencyContacts.length > 0 ? (
                      <div className="space-y-3">
                        {selectedMember.emergencyContacts.map((contact, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium">{contact.name}</p>
                              {contact.isPrimary && (
                                <Badge variant="default">Primary</Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="flex items-center gap-2">
                                <span className="text-muted-foreground">Relationship:</span>
                                {contact.relationship}
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                              </p>
                              <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {contact.email}
                              </p>
                              {contact.address && (
                                <p className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {contact.address}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No emergency contacts added</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
