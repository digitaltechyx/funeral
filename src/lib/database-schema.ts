import { Timestamp } from 'firebase/firestore';

// Database collection names
export const COLLECTIONS = {
  MEMBERS: 'members',
  CLAIMS: 'claims',
  PAYMENTS: 'payments',
  DEPENDENTS: 'dependents',
  AUDIT_LOGS: 'audit_logs',
  ADMIN_USERS: 'admin_users',
  WALLET_POOL: 'wallet_pool',
  SADQA_TRANSACTIONS: 'sadqa_transactions',
  TRANSPARENCY_REPORTS: 'transparency_reports',
  SYSTEM_STATS: 'system_stats',
} as const;

// Member document structure
export interface EmergencyContact {
  name: string;
  relationship: string; // e.g., "Spouse", "Child", "Parent", "Sibling", "Friend"
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean; // Primary emergency contact
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  joinDate: Timestamp;
  walletBalance: number;
  sadqaWallet: number; // User's sadqa wallet balance (up to $1,000)
  role: 'member' | 'admin' | 'super_admin';
  stripeCustomerId?: string;
  hasPaymentMethod: boolean; // Whether user has added payment method
  emergencyContacts: EmergencyContact[]; // Required emergency contacts
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Dependent document structure
export interface Dependent {
  id: string;
  memberId: string;
  name: string;
  relationship: string;
  addedDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Claim document structure
export interface Claim {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  deceasedName: string;
  address: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  relationship: string;
  dateOfDeath: Timestamp;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  submissionDate: Timestamp;
  funeralDate: Timestamp;
  notes?: string;
  // Death certificate file info
  deathCertificateFileName: string;
  deathCertificateFileSize: number;
  deathCertificateFileType: string;
  deathCertificateURL: string;
  documents: string[]; // Array of file URLs
  rejectionReason?: string;
  approvedBy?: string; // Admin user ID
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment document structure
export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  shares: number;
  amountPerShare: number;
  paymentIntentId: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'memorial_share' | 'sadqa_donation' | 'other';
  chargedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Audit log document structure
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Admin user document structure
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Wallet pool document structure (managed by Super Admin)
export interface WalletPool {
  id: string;
  currentBalance: number;
  totalCollected: number;
  totalWithdrawn: number;
  lastWithdrawalDate?: Timestamp;
  lastWithdrawalAmount?: number;
  lastUpdatedBy: string; // Super Admin ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sadqa transaction document structure
export interface SadqaTransaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: 'donation' | 'usage';
  description: string;
  invoiceUrl?: string; // For usage transactions
  processedBy?: string; // Admin ID who processed the usage
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// System statistics document structure
export interface SystemStats {
  id: string;
  totalFunerals: number;
  lastUpdatedBy: string; // Admin ID
  lastUpdateReason: string;
  lastUpdatedBy: string; // Admin name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Transparency report document structure
export interface TransparencyReport {
  id: string;
  title: string;
  message: string;
  funeralId?: string; // Optional, links to a specific funeral/claim
  expenses: {
    id: string;
    description: string;
    amount: number;
    category: 'Service' | 'Product' | 'Transportation' | 'Other';
  }[];
  totalExpenses: number;
  billImageUrls: string[]; // URLs to uploaded bill images/PDFs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID
  status: 'Draft' | 'Published';
}

// Database indexes (for Firestore queries)
export const DATABASE_INDEXES = {
  // Members indexes
  MEMBERS_BY_STATUS: ['status'],
  MEMBERS_BY_EMAIL: ['email'],
  MEMBERS_BY_JOIN_DATE: ['joinDate'],
  
  // Claims indexes
  CLAIMS_BY_STATUS: ['status'],
  CLAIMS_BY_MEMBER: ['memberId'],
  CLAIMS_BY_SUBMISSION_DATE: ['submissionDate'],
  CLAIMS_BY_DEATH_DATE: ['dateOfDeath'],
  
  // Payments indexes
  PAYMENTS_BY_MEMBER: ['memberId'],
  PAYMENTS_BY_CLAIM: ['claimId'],
  PAYMENTS_BY_DATE: ['paymentDate'],
  PAYMENTS_BY_STATUS: ['status'],
  
  // Dependents indexes
  DEPENDENTS_BY_MEMBER: ['memberId'],
  
  // Audit logs indexes
  AUDIT_LOGS_BY_USER: ['userId'],
  AUDIT_LOGS_BY_ACTION: ['action'],
  AUDIT_LOGS_BY_TIMESTAMP: ['timestamp'],
} as const;

