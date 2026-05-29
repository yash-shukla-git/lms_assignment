// Shared TypeScript types and interfaces — to be defined

export type Role = 'borrower' | 'sales' | 'sanction' | 'disbursement' | 'collection';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
