// Application configuration
export const APP_CONFIG = {
  // Contact Information
  contact: {
    whatsapp: {
      phoneNumber: "+1234567890", // Replace with your actual WhatsApp number
      defaultMessage: "Hello! I need help with my Funeral Share account.",
    },
    phone: "+1234567890", // Replace with your actual phone number
    email: "support@funeralshare.com", // Replace with your actual support email
  },

  // Business Information
  business: {
    name: "Funeral Share Community",
    hours: {
      regular: "Mon-Fri 9AM-6PM EST",
      emergency: "Available 24/7",
    },
  },

  // Funeral Cost Configuration
  funeral: {
    cost: 8000, // Fixed funeral cost
    minimumActiveMembers: 1000, // Minimum members to officially begin
    maxPayout: 8000, // Maximum payout per funeral
  },

  // Sadqa Wallet Configuration
  sadqa: {
    maxDonation: 1000, // Maximum donation per user
    paymentMethod: "Zelle", // Payment method for Sadqa
  },
} as const;

// Export individual configs for easy access
export const CONTACT_CONFIG = APP_CONFIG.contact;
export const BUSINESS_CONFIG = APP_CONFIG.business;
export const FUNERAL_CONFIG = APP_CONFIG.funeral;
export const SADQA_CONFIG = APP_CONFIG.sadqa;
