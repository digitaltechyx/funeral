'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import { EmergencyContact } from '@/lib/database-schema';

export default function EmergencyContactsPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: false
  });

  useEffect(() => {
    console.log('Emergency contacts useEffect triggered');
    console.log('userProfile:', userProfile);
    console.log('userProfile.emergencyContacts:', userProfile?.emergencyContacts);
    
    if (userProfile?.emergencyContacts) {
      setEmergencyContacts(userProfile.emergencyContacts);
      console.log('Set emergency contacts:', userProfile.emergencyContacts);
    } else {
      console.log('No emergency contacts found in userProfile');
      setEmergencyContacts([]);
    }
    setLoading(false);
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      console.log('Submitting emergency contact:', formData);
      console.log('Current emergency contacts:', emergencyContacts);
      
      const updatedContacts = editingContact
        ? emergencyContacts.map(contact => 
            contact.id === editingContact.id 
              ? { ...formData, id: editingContact.id }
              : contact
          )
        : [...emergencyContacts, { ...formData, id: Date.now().toString() }];

      console.log('Updated contacts to save:', updatedContacts);

      // Update user profile in Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await updateDoc(doc(db, 'members', user.uid), {
        emergencyContacts: updatedContacts
      });

      console.log('Emergency contacts saved to Firestore');

      // Refresh user profile to get updated emergency contacts
      await refreshUserProfile();
      
      console.log('User profile refreshed');
      
      setEmergencyContacts(updatedContacts);
      setDialogOpen(false);
      setEditingContact(null);
      setFormData({
        name: '',
        relationship: '',
        phone: '',
        email: '',
        address: '',
        isPrimary: false
      });
      
      console.log('Emergency contact submission completed');
    } catch (error) {
      console.error('Error saving emergency contact:', error);
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      isPrimary: contact.isPrimary
    });
    setDialogOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!user) return;

    try {
      const updatedContacts = emergencyContacts.filter(contact => contact.id !== contactId);
      
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await updateDoc(doc(db, 'members', user.uid), {
        emergencyContacts: updatedContacts
      });

      // Refresh user profile to get updated emergency contacts
      await refreshUserProfile();
      
      setEmergencyContacts(updatedContacts);
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingContact(null);
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading emergency contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Emergency Contacts</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your emergency contact information for funeral assistance.
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-base sm:text-lg">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm sm:text-base text-amber-700 leading-relaxed">
            Emergency contacts are crucial for funeral assistance. Please ensure your contact information 
            is up-to-date and accurate. In case of an emergency, we will use this information to reach 
            your designated contacts.
          </p>
        </CardContent>
      </Card>

      {/* Add Contact Button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContact(null)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Emergency Contact</span>
              <span className="sm:hidden">Add Contact</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </DialogTitle>
              <DialogDescription>
                {editingContact 
                  ? 'Update the emergency contact information below.'
                  : 'Add a new emergency contact for funeral assistance.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="relationship">Relationship *</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPrimary" className="text-sm">
                  Primary emergency contact
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Emergency Contacts List */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {emergencyContacts.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
              <p className="text-muted-foreground text-center mb-4 px-4">
                You haven't added any emergency contacts yet. Add your first contact to get started.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          emergencyContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold truncate">{contact.name}</h3>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="capitalize truncate">{contact.relationship}</span>
                        </div>
                        
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{contact.phone}</span>
                          </div>
                        )}
                        
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        
                        {contact.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed break-words">{contact.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
