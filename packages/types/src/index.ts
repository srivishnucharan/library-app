export type Role = 'MEMBER' | 'LIBRARIAN' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
