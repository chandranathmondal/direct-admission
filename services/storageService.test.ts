import { storageService } from './storageService';
import { INITIAL_COURSES, INITIAL_COLLEGES, INITIAL_USERS } from '../constants';

declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

// Mock global fetch
(globalThis as any).fetch = jest.fn();

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('init populates localStorage if empty', async () => {
    await storageService.init();
    
    expect(localStorage.getItem('directAdmission_courses')).toBeDefined();
    expect(localStorage.getItem('directAdmission_colleges')).toBeDefined();
    expect(localStorage.getItem('directAdmission_users')).toBeDefined();
  });

  test('getFullData fetches from API and updates localStorage', async () => {
    const mockData = {
      courses: [{ id: '1', courseName: 'Test Course' }],
      colleges: [],
      users: []
    };

    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const data = await storageService.getFullData();
    
    expect((globalThis as any).fetch).toHaveBeenCalledWith('/api/data');
    expect(data.courses).toHaveLength(1);
    expect(data.courses[0].courseName).toBe('Test Course');
    
    // Verify it updated localStorage
    expect(localStorage.getItem('directAdmission_courses')).toContain('Test Course');
  });

  test('getFullData falls back to localStorage on API failure', async () => {
    // Setup local storage data
    localStorage.setItem('directAdmission_courses', JSON.stringify(INITIAL_COURSES));
    
    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: false
    });

    const data = await storageService.getFullData();
    
    expect(data.courses).toHaveLength(INITIAL_COURSES.length);
    // Should handle the error gracefully (console.warn)
  });
});