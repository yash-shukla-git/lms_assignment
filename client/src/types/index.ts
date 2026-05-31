export type Role =
  | 'borrower'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection'
  | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
