import type { Role } from '../types';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  companyName?: string;
  customerId?: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
    companyName?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  demoLogin: (targetRole: Role) => Promise<AuthUser>;
}

// Built-in Seed/Demo Users for Immediate Hackathon Testing
export const DEMO_USERS: Record<Role, AuthUser> = {
  ADMIN: {
    id: 1,
    email: 'admin@brightloop.com',
    fullName: 'System Administrator',
    role: 'ADMIN',
  },
  STAFF: {
    id: 2,
    email: 'staff@brightloop.com',
    fullName: 'Bob Jenkins (Billing Staff)',
    role: 'STAFF',
  },
  CUSTOMER: {
    id: 3,
    email: 'customer@acme.com',
    fullName: 'Alice Walker',
    role: 'CUSTOMER',
    companyName: 'Acme Software Labs',
    customerId: 1,
  },
};
