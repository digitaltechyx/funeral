'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  AlertTriangle,
  CheckCircle,
  Heart
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmergencyContact } from "@/contexts/AuthContext";

export default function EmergencyContactsPage() {
  const { userProfile } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock emergency contacts - in real app, this would come from Firestore
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      name: "Sarah Johnson",
      relationship: "Spouse",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@email.com",
      address: "123 Main St, New York, NY 10001",
      isPrimary: true
    },
    {
      name: "Michael Johnson",
      relationship: "Son",
      phone: "+1 (555) 987-6543",
      email: "michael.j@email.com",
      isPrimary: false
    }
  ]);

  const [formData, setFormData] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: false
  });

  const relationshipOptions = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Friend',
    'Cousin',
    'Neighbor',
    'Colleague',
    'Other'
  ];

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: false
    });
  };

  const handleEdit = (contact: EmergencyContact, index: number) => {
    setEditingId(index.toString());
    setFormData({ ...contact });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.relationship || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name, relationship, and phone number are required.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual save to Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingId !== null) {
        // Update existing contact
        const index = parseInt(editingId);
        const updatedContacts = [...emergencyContacts];
        updatedContacts[index] = formData;
        setEmergencyContacts(updatedContacts);
        setEditingId(null);
      } else {
        // Add new contact
        setEmergencyContacts([...emergencyContacts, formData]);
        setIsAdding(false);
      }

      toast({
        title: "Emergency Contact Saved",
        description: "Your emergency contact has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save emergency contact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: false
    });
  };

  const handleDelete = async (index: number) => {
    if (emergencyContacts.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: "You must have at least one emergency contact.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual delete from Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updatedContacts);

      toast({
        title: "Emergency Contact Removed",
        description: "The emergency contact has been removed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove emergency contact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (index: number) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual update in Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedContacts = emergencyContacts.map((contact, i) => ({
        ...contact,
        isPrimary: i === index
      }));
      setEmergencyContacts(updatedContacts);

      toast({
        title: "Primary Contact Updated",
        description: "The primary emergency contact has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update primary contact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emergency Contacts</h1>
            <p className="text-muted-foreground">
              Manage your emergency contact information for the community
            </p>
          </div>
          <Button onClick={handleAdd} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Important Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Important Notice</h3>
                <p className="text-sm text-orange-800 mt-1">
                  Emergency contacts are required for all community members. These contacts will be used 
                  by administrators to reach out in case of emergencies or important community matters. 
                  Please ensure all information is accurate and up-to-date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {(isAdding || editingId !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </CardTitle>
              <CardDescription>
                Provide complete information for your emergency contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select 
                    value={formData.relationship} 
                    onValueChange={(value) => setFormData({...formData, relationship: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="isPrimary">Set as primary emergency contact</Label>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Contact'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contacts List */}
        <div className="space-y-4">
          {emergencyContacts.map((contact, index) => (
            <Card key={index} className={contact.isPrimary ? "border-green-200 bg-green-50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{contact.name}</h3>
                      </div>
                      {contact.isPrimary && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      <Badge variant="outline">{contact.relationship}</Badge>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2">
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
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!contact.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(index)}
                        disabled={isLoading}
                        title="Set as primary contact"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contact, index)}
                      disabled={isLoading}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {emergencyContacts.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requirements Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Emergency Contact Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Minimum Requirements</p>
                  <p className="text-sm text-muted-foreground">
                    You must have at least one emergency contact with name, relationship, and phone number.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Primary Contact</p>
                  <p className="text-sm text-muted-foreground">
                    Designate one contact as primary for urgent matters and community notifications.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Admin Access</p>
                  <p className="text-sm text-muted-foreground">
                    Administrators can view emergency contacts for community safety and emergency situations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
