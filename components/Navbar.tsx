
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onNavigate: (view: 'home' | 'login' | 'admin') => void;
  currentView: 'home' | 'login' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogoutClick, onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check role directly against Enum (Values are now 'Admin', 'Editor')
  const isAdminOrEditor = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

  return (
    <div className="flex flex-col w-full">
      {/* Top Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span>🇮🇳 India's Trusted Admission Portal</span>
            <span className="text-slate-500">|</span>
            {/* Updated Support Number */}
            <span>📞 Support: +91-89260-26739</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Counselling</span>
            <span className="hover:text-white cursor-pointer">Scholarships</span>
            <span className="hover:text-white cursor-pointer">Education Loans</span>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              {/* Logo Section */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="text-4xl filter drop-shadow-sm">
                  🎓
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif leading-none">
                    Direct-Admission
                  </h1>
                  <span className="text-[10px] text-amber-700 uppercase tracking-widest font-semibold mt-1">
                    The Official Portal
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* Navigation for Logged In Users Only */}
              {user && (
                <>
                  <button 
                    onClick={() => onNavigate('home')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-sans ${currentView === 'home' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-600 hover:text-amber-700'}`}
                  >
                    Home Page
                  </button>
                  
                  {isAdminOrEditor && (
                    <button 
                      onClick={() => onNavigate('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-sans ${currentView === 'admin' ? 'bg-slate-900 text-amber-400 shadow-md' : 'text-slate-600 hover:text-amber-700'}`}
                    >
                      Dashboard
                    </button>
                  )}
                </>
              )}
              
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center text-xs font-sans min-w-[100px]">
                     <p className="font-semibold text-slate-800 text-center w-full">{user.name}</p>
                     <div className="flex items-center justify-between mt-0.5 w-full gap-2">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wide">{user.role}</p>
                        <button 
                          onClick={onLogoutClick}
                          className="text-[10px] text-red-600 hover:text-red-800 font-medium hover:underline uppercase tracking-wide"
                        >
                          Logout
                        </button>
                     </div>
                  </div>
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                  />
                </div>
              ) : (
                /* Hide Login button if already on login page */
                currentView !== 'login' && (
                  <button
                    onClick={onLoginClick}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded shadow-sm text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all font-sans"
                  >
                    Admin Login
                  </button>
                )
              )}
            </div>

            {/* Mobile Menu Button - Hidden on Login Page */}
            {currentView !== 'login' && (
              <div className="flex md:hidden items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown - Hidden on Login Page */}
        {isMobileMenuOpen && (currentView === 'home' || currentView === 'admin') && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-fadeIn">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                   {/* User Profile in Mobile Menu */}
                   <div className="flex items-center px-3 py-3 border-b border-slate-100 mb-2 bg-slate-50 rounded-md">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full border border-slate-200"
                      />
                      <div className="ml-3">
                        <div className="text-base font-medium leading-none text-slate-800 font-serif">{user.name}</div>
                        <div className="text-sm font-medium leading-none text-slate-500 mt-1">{user.email}</div>
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-wide bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">{user.role}</span>
                      </div>
                   </div>

                   <button 
                    onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'home' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                   >
                     Home Page
                   </button>
                   
                   {isAdminOrEditor && (
                    <button 
                      onClick={() => { onNavigate('admin'); setIsMobileMenuOpen(false); }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'admin' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      Dashboard
                    </button>
                   )}
                   
                   <button 
                    onClick={() => { onLogoutClick(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                   >
                     Logout
                   </button>
                </>
              ) : (
                /* Hide Login button if already on login page (although parent conditional already ensures we are not on login page) */
                  <button
                    onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-center px-3 py-3 rounded-md text-base font-medium text-white bg-slate-900 hover:bg-slate-800"
                  >
                    Admin Login
                  </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};
