
export interface College {
  id: string;
  name: string;
  location: string;
  state: string;
  logoUrl?: string;
  description?: string; // Short bio of college
  rating: number; // 0 to 5
  ratingCount: number;
}

export interface Course {
  id: string;
  collegeId: string; // Foreign Key
  courseName: string;
  fees: number; // Total fees in INR
  duration: string; // e.g., "4 Years"
  description: string;
  rating: number; // 0 to 5
  ratingCount: number;
}

// Used for Frontend Rendering (Result of Join)
export interface EnrichedCourse extends Course {
  collegeName: string;
  location: string;
  state: string;
  logoUrl?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR'
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
}