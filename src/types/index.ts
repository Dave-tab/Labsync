export type Role = 'student' | 'lecturer' | 'administrator';

export interface UserProfile {
  id: string; // Corresponds to Firebase Auth UID
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  faculty?: string;
  department?: string;
  department_id?: string; // Kept for backwards compatibility
  level?: string; // Current level for students, or taught levels for lecturers
  office_location?: string; // For lecturers
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
