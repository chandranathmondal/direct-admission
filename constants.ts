
import { Course, User, UserRole, College } from './types';

// Read initial admin from Environment Variable
export const INITIAL_ADMIN_EMAIL = process.env.REACT_APP_INITIAL_ADMIN_EMAIL || "contact@direct-admission.com";

export const STATES_OF_INDIA = [
  "West Bengal"
];

// Empty defaults - Data will load from Google Sheet via Server
export const INITIAL_COLLEGES: College[] = [];
export const INITIAL_COURSES: Course[] = [];

// Fallback user if DB is completely empty (will be overwritten by server data)
export const INITIAL_USERS: User[] = [
  {
    email: INITIAL_ADMIN_EMAIL,
    name: 'System Admin',
    role: UserRole.ADMIN,
    avatar: `https://ui-avatars.com/api/?name=Admin&background=0f172a&color=fff`
  }
];
