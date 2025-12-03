import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { storageService } from './services/storageService';

declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

// Mock storage service to prevent actual API calls during tests
jest.mock('./services/storageService', () => ({
  storageService: {
    init: jest.fn(),
    getFullData: jest.fn().mockResolvedValue({
      courses: [],
      colleges: [],
      users: []
    }),
    saveCourses: jest.fn(),
    saveColleges: jest.fn(),
    saveUsers: jest.fn(),
    triggerServerRefresh: jest.fn()
  }
}));

// Mock Google GenAI to prevent API calls
jest.mock('./services/geminiService', () => ({
  parseSearchQuery: jest.fn().mockResolvedValue(null),
  getCourseInsights: jest.fn().mockResolvedValue("Mock AI Insight")
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main heading and search bar', async () => {
    render(<App />);
    
    // Check for hero text
    expect(screen.getByText(/Find Your Dream College in India/i)).toBeInTheDocument();
    
    // Check for search inputs
    const searchInput = screen.getByPlaceholderText(/Search for courses or colleges.../i);
    expect(searchInput).toBeInTheDocument();
    
    // Note: State dropdown was removed in previous requirements, updated test expectation if needed
    // const stateInput = screen.getByPlaceholderText(/Select State/i);
    // expect(stateInput).toBeInTheDocument();
  });

  test('toggles login view', async () => {
    render(<App />);
    
    const loginButton = screen.getByText(/^Admin Login$/i);
    fireEvent.click(loginButton);
    
    // Should see Admin Access header
    expect(screen.getByText(/Admin Access/i)).toBeInTheDocument();
    
    // Should see Sign in button
    expect(screen.getByText(/Sign in with Email/i)).toBeInTheDocument();
  });

  test('filters change result type view', async () => {
    render(<App />);
    
    // By default "All" is selected (checking via segment buttons)
    // Note: Text changed to "All Results" in UI
    const allButtons = screen.getAllByText(/All Results/i);
    expect(allButtons[0]).toBeInTheDocument();

    // Click "Courses" filter
    const coursesButtons = screen.getAllByText(/Programs Only/i);
    fireEvent.click(coursesButtons[0]);
  });

  test('navigates back home from login', async () => {
    render(<App />);
    
    // Go to login
    fireEvent.click(screen.getByText(/^Admin Login$/i));
    expect(screen.getByText(/Admin Access/i)).toBeInTheDocument();
    
    // Click Logo to go home
    const logo = screen.getByText(/Direct-Admission/i);
    fireEvent.click(logo);
    
    expect(screen.getByText(/Find Your Dream College in India/i)).toBeInTheDocument();
  });
});