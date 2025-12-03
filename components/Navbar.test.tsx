import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import { User, UserRole } from '../types';

declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;

describe('Navbar Component', () => {
  const mockNavigate = jest.fn();
  const mockLoginClick = jest.fn();
  const mockLogoutClick = jest.fn();

  const mockUser: User = {
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.ADMIN,
    avatar: 'avatar.png'
  };

  test('renders login button when user is null', () => {
    render(
      <Navbar 
        user={null} 
        onLoginClick={mockLoginClick}
        onLogoutClick={mockLogoutClick}
        onNavigate={mockNavigate}
        currentView="home"
      />
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('renders user profile and logout when user is logged in', () => {
    render(
      <Navbar 
        user={mockUser} 
        onLoginClick={mockLoginClick}
        onLogoutClick={mockLogoutClick}
        onNavigate={mockNavigate}
        currentView="home"
      />
    );

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls onNavigate when Home Page button clicked', () => {
    render(
      <Navbar 
        user={mockUser} 
        onLoginClick={mockLoginClick}
        onLogoutClick={mockLogoutClick}
        onNavigate={mockNavigate}
        currentView="admin"
      />
    );

    fireEvent.click(screen.getByText('Home Page'));
    expect(mockNavigate).toHaveBeenCalledWith('home');
  });

  test('shows Dashboard button only for Admin/Editor', () => {
    render(
      <Navbar 
        user={mockUser} 
        onLoginClick={mockLoginClick}
        onLogoutClick={mockLogoutClick}
        onNavigate={mockNavigate}
        currentView="home"
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});