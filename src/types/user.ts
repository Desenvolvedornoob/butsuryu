// Update the User type to ensure status property has correct type
export type UserRole = 'admin' | 'funcionario' | 'superuser' | 'observador';

export type UserStatus = 'active' | 'inactive' | 'desligamento';

export interface User {
  id: string;
  first_name: string;
  name_japanese?: string;
  birth_date?: string;
  hire_date?: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  factory_id: string | string[];
  responsible: string;
  created_at: string;
  updated_at: string;
  // Campo interno para controle de estado (não persiste no banco)
  _loading_state?: 'loading' | 'loaded' | 'error' | 'temp';
  // Campo para motivo do desligamento
  dismissal_reason?: string;
  // Campo para cidade onde mora
  city?: string;
  // Campo para prestadora
  prestadora?: string;
}

export type StatusType = 'active' | 'inactive' | 'desligamento' | 'pending' | 'approved' | 'rejected';

export interface UserPermissions {
  viewDashboard: boolean;
  manageEmployees: boolean;
  approveRequests: boolean;
  canApproveLeaves: boolean;
  canViewOwnLeaves: boolean;
  canManageEmployees: boolean;
  canManageFactories: boolean;
  canManageShifts: boolean;
  canManageUsers: boolean;
  createRequest: boolean;
  manageSystem: boolean;
  view_requests: boolean;
}
