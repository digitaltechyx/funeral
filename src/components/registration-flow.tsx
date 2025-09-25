'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Phone, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import { EmergencyContact } from '@/contexts/AuthContext';

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  emergencyContacts: EmergencyContact[];
}

interface RegistrationFlowProps {
  onComplete: () => void;
}

export function RegistrationFlow({ onComplete }: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    emergencyContacts: []
  });

  const [emergencyContactForm, setEmergencyContactForm] = useState<EmergencyContact>({
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

  const addEmergencyContact = () => {
    if (!emergencyContactForm.name || !emergencyContactForm.relationship || !emergencyContactForm.phone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name, relationship, and phone number are required.",
      });
      return;
    }

    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, emergencyContactForm]
    });

    setEmergencyContactForm({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: false
    });
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts
    });
  };

  const setPrimaryContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts.map((contact, i) => ({
      ...contact,
      isPrimary: i === index
    }));
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts
    });
  };

  const handleSubmit = async () => {
    if (formData.emergencyContacts.length === 0) {
      toast({
        variant: "destructive",
        title: "Emergency Contact Required",
        description: "You must provide at least one emergency contact to register.",
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.name, formData.phone, 'member');
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields.",
        });
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 2 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Provide your basic information to create your account
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
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                />
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Create a password"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={nextStep}>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Emergency Contacts */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>
              Add at least one emergency contact (required for community safety)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Important Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Emergency Contact Required</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    Emergency contacts are mandatory for all community members. 
                    This information will be used by administrators for community safety and emergency situations.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Emergency Contact Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Add Emergency Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Full Name *</Label>
                  <Input
                    id="contact-name"
                    value={emergencyContactForm.name}
                    onChange={(e) => setEmergencyContactForm({...emergencyContactForm, name: e.target.value})}
                    placeholder="Enter contact's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-relationship">Relationship *</Label>
                  <Select 
                    value={emergencyContactForm.relationship} 
                    onValueChange={(value) => setEmergencyContactForm({...emergencyContactForm, relationship: value})}
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
                  <Label htmlFor="contact-phone">Phone Number *</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={emergencyContactForm.phone}
                    onChange={(e) => setEmergencyContactForm({...emergencyContactForm, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={emergencyContactForm.email}
                    onChange={(e) => setEmergencyContactForm({...emergencyContactForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  value={emergencyContactForm.address}
                  onChange={(e) => setEmergencyContactForm({...emergencyContactForm, address: e.target.value})}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-primary"
                  checked={emergencyContactForm.isPrimary}
                  onChange={(e) => setEmergencyContactForm({...emergencyContactForm, isPrimary: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is-primary">Set as primary emergency contact</Label>
              </div>
              <Button onClick={addEmergencyContact} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Emergency Contact
              </Button>
            </div>

            {/* Emergency Contacts List */}
            {formData.emergencyContacts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Your Emergency Contacts</h3>
                {formData.emergencyContacts.map((contact, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${contact.isPrimary ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{contact.name}</h4>
                          {contact.isPrimary && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Primary
                            </Badge>
                          )}
                          <Badge variant="outline">{contact.relationship}</Badge>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!contact.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimaryContact(index)}
                            title="Set as primary contact"
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmergencyContact(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || formData.emergencyContacts.length === 0}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
