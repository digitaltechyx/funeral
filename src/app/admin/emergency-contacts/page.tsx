'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Search,
  AlertTriangle,
  CheckCircle,
  Heart,
  Users,
  Filter
} from "lucide-react";
import { EmergencyContact } from "@/contexts/AuthContext";

interface MemberWithEmergencyContacts {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  emergencyContacts: EmergencyContact[];
}

export default function AdminEmergencyContactsPage() {
  const [members, setMembers] = useState<MemberWithEmergencyContacts[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithEmergencyContacts[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real app, this would come from Firestore
  useEffect(() => {
    const mockMembers: MemberWithEmergencyContacts[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        status: 'Active',
        emergencyContacts: [
          {
            name: 'Sarah Smith',
            relationship: 'Spouse',
            phone: '+1 (555) 123-4568',
            email: 'sarah.smith@email.com',
            address: '123 Main St, New York, NY 10001',
            isPrimary: true
          },
          {
            name: 'Michael Smith',
            relationship: 'Son',
            phone: '+1 (555) 987-6543',
            email: 'michael.smith@email.com',
            isPrimary: false
          }
        ]
      },
      {
        id: '2',
        name: 'Emily Johnson',
        email: 'emily.johnson@email.com',
        phone: '+1 (555) 234-5678',
        status: 'Active',
        emergencyContacts: [
          {
            name: 'Robert Johnson',
            relationship: 'Husband',
            phone: '+1 (555) 234-5679',
            email: 'robert.johnson@email.com',
            address: '456 Oak Ave, Los Angeles, CA 90210',
            isPrimary: true
          }
        ]
      },
      {
        id: '3',
        name: 'David Wilson',
        email: 'david.wilson@email.com',
        phone: '+1 (555) 345-6789',
        status: 'Inactive',
        emergencyContacts: [
          {
            name: 'Lisa Wilson',
            relationship: 'Wife',
            phone: '+1 (555) 345-6790',
            isPrimary: true
          }
        ]
      }
    ];

    setMembers(mockMembers);
    setFilteredMembers(mockMembers);
    setIsLoading(false);
  }, []);

  // Filter members based on search term and status
  useEffect(() => {
    let filtered = members;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm) ||
        member.emergencyContacts.some(contact =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.phone.includes(searchTerm)
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter]);

  const getStatusBadge = (status: 'Active' | 'Inactive') => {
    if (status === 'Active') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getEmergencyContactStatus = (member: MemberWithEmergencyContacts) => {
    if (member.emergencyContacts.length === 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Contacts
        </Badge>
      );
    }
    
    const hasPrimary = member.emergencyContacts.some(contact => contact.isPrimary);
    if (!hasPrimary) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Primary
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Complete
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading emergency contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emergency Contacts</h1>
            <p className="text-muted-foreground">
              View and manage member emergency contact information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members or emergency contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'Active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'Inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>
                        {member.email} • {member.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(member.status)}
                    {getEmergencyContactStatus(member)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {member.emergencyContacts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p>No emergency contacts provided</p>
                    <p className="text-sm">This member needs to add emergency contact information</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {member.emergencyContacts.map((contact, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${contact.isPrimary ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{contact.name}</h4>
                              {contact.isPrimary && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <Heart className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              <Badge variant="outline">{contact.relationship}</Badge>
                            </div>
                            
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{contact.phone}</span>
                              </div>
                              {contact.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{contact.email}</span>
                                </div>
                              )}
                              {contact.address && (
                                <div className="flex items-start gap-2 md:col-span-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <span className="text-sm">{contact.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Complete Contacts</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.emergencyContacts.length > 0 && m.emergencyContacts.some(c => c.isPrimary)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incomplete Contacts</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.emergencyContacts.length === 0 || !m.emergencyContacts.some(c => c.isPrimary)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
