
import { Course, User, College } from '../types';
import { INITIAL_COURSES, INITIAL_USERS, INITIAL_COLLEGES } from '../constants';

interface AppData {
  courses: Course[];
  colleges: College[];
  users: User[];
}

const LS_KEYS = {
  COURSES: 'directAdmission_courses',
  COLLEGES: 'directAdmission_colleges',
  USERS: 'directAdmission_users'
};

export const storageService = {
  async init(): Promise<void> {
    // Initialize LocalStorage with defaults if empty
    if (!localStorage.getItem(LS_KEYS.COURSES)) {
      localStorage.setItem(LS_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
    }
    if (!localStorage.getItem(LS_KEYS.COLLEGES)) {
      localStorage.setItem(LS_KEYS.COLLEGES, JSON.stringify(INITIAL_COLLEGES));
    }
    if (!localStorage.getItem(LS_KEYS.USERS)) {
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    return;
  },

  getLocalData(): AppData {
    try {
      const c = localStorage.getItem(LS_KEYS.COURSES);
      const col = localStorage.getItem(LS_KEYS.COLLEGES);
      const u = localStorage.getItem(LS_KEYS.USERS);
      return {
        courses: c ? JSON.parse(c) : INITIAL_COURSES,
        colleges: col ? JSON.parse(col) : INITIAL_COLLEGES,
        users: u ? JSON.parse(u) : INITIAL_USERS,
      };
    } catch (e) {
      console.error("Error reading from local storage", e);
      return { courses: INITIAL_COURSES, colleges: INITIAL_COLLEGES, users: INITIAL_USERS };
    }
  },

  async getFullData(): Promise<AppData> {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error(`API_UNAVAILABLE`);
      
      const data = await response.json();
      
      // Update local storage with fresh server data
      if (data.courses) localStorage.setItem(LS_KEYS.COURSES, JSON.stringify(data.courses));
      if (data.colleges) localStorage.setItem(LS_KEYS.COLLEGES, JSON.stringify(data.colleges));
      if (data.users) localStorage.setItem(LS_KEYS.USERS, JSON.stringify(data.users));

      return {
        courses: data.courses || [],
        colleges: data.colleges || [],
        users: data.users || []
      };
    } catch (error) {
      console.warn("Backend API unavailable. Falling back to LocalStorage.");
      return this.getLocalData();
    }
  },

  async triggerServerRefresh(): Promise<void> {
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      if (!response.ok) throw new Error("Failed to refresh server cache");
    } catch (e) {
      console.warn("Failed to trigger server refresh (likely in demo/offline mode)", e);
    }
  },

  async saveCourses(courses: Course[]): Promise<void> {
    // Always save to local storage first for immediate UI feedback
    localStorage.setItem(LS_KEYS.COURSES, JSON.stringify(courses));
    
    try {
      const response = await fetch('/api/save-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses })
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn("Failed to sync courses to backend. Saved locally only.");
    }
  },

  async saveColleges(colleges: College[]): Promise<void> {
    localStorage.setItem(LS_KEYS.COLLEGES, JSON.stringify(colleges));
    
    try {
      const response = await fetch('/api/save-colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colleges })
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn("Failed to sync colleges to backend. Saved locally only.");
    }
  },

  async saveUsers(users: User[]): Promise<void> {
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));

    try {
      const response = await fetch('/api/save-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users })
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn("Failed to sync users to backend. Saved locally only.");
    }
  }
};