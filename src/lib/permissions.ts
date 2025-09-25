import { UserProfile } from '@/contexts/AuthContext';

export interface Permission {
  name: string;
  description: string;
  requiredRole: 'member' | 'admin' | 'super_admin';
}

export const PERMISSIONS = {
  // Member permissions
  VIEW_OWN_PROFILE: 'view_own_profile',
  UPDATE_OWN_PROFILE: 'update_own_profile',
  SUBMIT_CLAIMS: 'submit_claims',
  VIEW_OWN_CLAIMS: 'view_own_claims',
  VIEW_OWN_PAYMENTS: 'view_own_payments',
  MANAGE_DEPENDENTS: 'manage_dependents',
  
  // Admin permissions
  VIEW_ALL_MEMBERS: 'view_all_members',
  VIEW_ALL_CLAIMS: 'view_all_claims',
  APPROVE_CLAIMS: 'approve_claims',
  REJECT_CLAIMS: 'reject_claims',
  CHARGE_MEMBERS: 'charge_members',
  VIEW_REPORTS: 'view_reports',
  MANAGE_FUNERALS: 'manage_funerals',
  
  // Super Admin permissions
  CREATE_ADMINS: 'create_admins',
  REMOVE_ADMINS: 'remove_admins',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

export const PERMISSION_DEFINITIONS: Record<string, Permission> = {
  [PERMISSIONS.VIEW_OWN_PROFILE]: {
    name: 'View Own Profile',
    description: 'View own member profile',
    requiredRole: 'member'
  },
  [PERMISSIONS.UPDATE_OWN_PROFILE]: {
    name: 'Update Own Profile',
    description: 'Update own member profile',
    requiredRole: 'member'
  },
  [PERMISSIONS.SUBMIT_CLAIMS]: {
    name: 'Submit Claims',
    description: 'Submit funeral claims',
    requiredRole: 'member'
  },
  [PERMISSIONS.VIEW_OWN_CLAIMS]: {
    name: 'View Own Claims',
    description: 'View own submitted claims',
    requiredRole: 'member'
  },
  [PERMISSIONS.VIEW_OWN_PAYMENTS]: {
    name: 'View Own Payments',
    description: 'View own payment history',
    requiredRole: 'member'
  },
  [PERMISSIONS.MANAGE_DEPENDENTS]: {
    name: 'Manage Dependents',
    description: 'Add, edit, or remove dependents',
    requiredRole: 'member'
  },
  [PERMISSIONS.VIEW_ALL_MEMBERS]: {
    name: 'View All Members',
    description: 'View all member profiles',
    requiredRole: 'admin'
  },
  [PERMISSIONS.VIEW_ALL_CLAIMS]: {
    name: 'View All Claims',
    description: 'View all submitted claims',
    requiredRole: 'admin'
  },
  [PERMISSIONS.APPROVE_CLAIMS]: {
    name: 'Approve Claims',
    description: 'Approve funeral claims',
    requiredRole: 'admin'
  },
  [PERMISSIONS.REJECT_CLAIMS]: {
    name: 'Reject Claims',
    description: 'Reject funeral claims',
    requiredRole: 'admin'
  },
  [PERMISSIONS.CHARGE_MEMBERS]: {
    name: 'Charge Members',
    description: 'Charge members for funerals',
    requiredRole: 'admin'
  },
  [PERMISSIONS.VIEW_REPORTS]: {
    name: 'View Reports',
    description: 'View system reports and analytics',
    requiredRole: 'admin'
  },
  [PERMISSIONS.MANAGE_FUNERALS]: {
    name: 'Manage Funerals',
    description: 'Manage funeral events',
    requiredRole: 'admin'
  },
  [PERMISSIONS.CREATE_ADMINS]: {
    name: 'Create Admins',
    description: 'Create new admin accounts',
    requiredRole: 'super_admin'
  },
  [PERMISSIONS.REMOVE_ADMINS]: {
    name: 'Remove Admins',
    description: 'Remove admin accounts',
    requiredRole: 'super_admin'
  },
  [PERMISSIONS.MANAGE_SYSTEM]: {
    name: 'Manage System',
    description: 'Manage system-wide settings',
    requiredRole: 'super_admin'
  },
  [PERMISSIONS.VIEW_AUDIT_LOGS]: {
    name: 'View Audit Logs',
    description: 'View system audit logs',
    requiredRole: 'super_admin'
  },
  [PERMISSIONS.SYSTEM_SETTINGS]: {
    name: 'System Settings',
    description: 'Modify system settings',
    requiredRole: 'super_admin'
  },
};

export function hasPermission(userProfile: UserProfile | null, permission: string): boolean {
  if (!userProfile) return false;
  
  const permissionDef = PERMISSION_DEFINITIONS[permission];
  if (!permissionDef) return false;
  
  // Check role hierarchy
  const roleHierarchy = {
    'member': 1,
    'admin': 2,
    'super_admin': 3
  };
  
  const userRoleLevel = roleHierarchy[userProfile.role] || 0;
  const requiredRoleLevel = roleHierarchy[permissionDef.requiredRole] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
}

export function isSuperAdmin(userProfile: UserProfile | null): boolean {
  return userProfile?.role === 'super_admin';
}

export function isAdmin(userProfile: UserProfile | null): boolean {
  return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
}

export function isMember(userProfile: UserProfile | null): boolean {
  return userProfile?.role === 'member';
}

export function canCreateAdmins(userProfile: UserProfile | null): boolean {
  return hasPermission(userProfile, PERMISSIONS.CREATE_ADMINS);
}

export function canRemoveAdmins(userProfile: UserProfile | null): boolean {
  return hasPermission(userProfile, PERMISSIONS.REMOVE_ADMINS);
}
