
export interface College {
  id: string;
  name: string;
  location: string;
  state: string;
  logoUrl?: string;
  description?: string; // Short bio of college
  phone?: string; // Contact number for admissions
}

export interface Course {
  id: string;
  collegeId: string; // Foreign Key
  courseName: string;
  fees: number; // Total fees in INR
  duration: string; // e.g., "4 Years"
  description: string;
}

// Used for Frontend Rendering (Result of Join)
export interface EnrichedCourse extends Course {
  collegeName: string;
  location: string;
  state: string;
  logoUrl?: string;
  collegePhone?: string;
}

export enum UserRole {
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
  EDITOR = 'Editor'
}

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface SearchFilters {
  query: string;
  location?: string;
  state?: string;
  maxFees?: number;
  sortIntent?: 'fees_low' | 'fees_high';
}
