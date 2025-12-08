
import { Course, User, UserRole, College } from './types';

// Dynamic Contact Configuration
export const CONTACT_PHONE = "9874530810";
export const CONTACT_EMAIL = "contact@direct-admission.com";

// Read initial admin from Constant (Previously Env Var)
export const INITIAL_ADMIN_EMAIL = CONTACT_EMAIL;

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
