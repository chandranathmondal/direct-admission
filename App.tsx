
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CourseCard } from './components/CourseCard';
import { CollegeCard } from './components/CollegeCard';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { DetailsModal } from './components/DetailsModal';
import { Course, User, UserRole, College, EnrichedCourse } from './types';
import { STATES_OF_INDIA, CONTACT_EMAIL, CONTACT_PHONE } from './constants';
import { parseSearchQuery } from './services/geminiService';
import { storageService } from './services/storageService';

export const App: React.FC = () => {
  // Application State
  const [view, setView] = useState<'home' | 'login' | 'admin'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loginErrorState, setLoginErrorState] = useState<string | null>(null);
  
  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [aiKeyword, setAiKeyword] = useState<string | null>(null); // Store AI-extracted keyword separately
  const [filterLocation, setFilterLocation] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // New Result Filters - Default to 'colleges'
  const [resultTypeFilter, setResultTypeFilter] = useState<'all' | 'courses' | 'colleges'>('colleges');
  // Default to Alphabetical Ascending
  const [sortBy, setSortBy] = useState<'fees_low' | 'fees_high' | 'alpha_asc' | 'alpha_desc'>('alpha_asc');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    viewMode: 'college' | 'course';
    selectedCollege: College | null;
    selectedCourse: EnrichedCourse | null;
  }>({
    isOpen: false,
    viewMode: 'college',
    selectedCollege: null,
    selectedCourse: null
  });

  // Delete Confirmation State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'user' | 'course' | 'college' | null;
    itemId: string | null;
    itemName?: string;
  }>({ isOpen: false, type: null, itemId: null });

  const fetchAllData = useCallback(async () => {
    try {
      await storageService.init();
      const data = await storageService.getFullData();
      setCourses(data.courses);
      setColleges(data.colleges);
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to initialize data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Load Data from Storage on Mount and every 1 hour
  useEffect(() => {
    fetchAllData();
    
    const intervalId = setInterval(() => {
      console.log("Triggering hourly data refresh...");
      fetchAllData();
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  const handleManualRefresh = async () => {
      setIsLoadingData(true);
      await storageService.triggerServerRefresh();
      await fetchAllData();
      setIsLoadingData(false);
  };

  // --- VOICE SEARCH ---
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice search.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsVoiceListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      setAiKeyword(null); // Clear previous AI context
      setIsVoiceListening(false);
      // Auto trigger AI search if input is long enough
      if (transcript.length > 5) {
         // handleAiSearch(transcript); // Optional: Auto trigger logic
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Voice error", event.error);
      setIsVoiceListening(false);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.start();
  };

  // --- JOIN LOGIC: Merge Course + College ---
  const enrichedCourses: EnrichedCourse[] = useMemo(() => {
    return courses.map(course => {
      const college = colleges.find(c => c.id === course.collegeId);
      return {
        ...course,
        collegeName: college?.name || 'Unknown College',
        location: college?.location || 'Unknown',
        state: college?.state || 'Unknown',
        logoUrl: college?.logoUrl,
        collegePhone: college?.phone
      };
    });
  }, [courses, colleges]);

  // --- UNIFIED SEARCH & FILTER LOGIC ---
  const filteredResults = useMemo(() => {
    // Use AI-extracted keyword if available (handles typos/specifics), otherwise raw user input
    const effectiveSearch = aiKeyword || searchTerm;
    const normalizedSearch = effectiveSearch.toLowerCase();
    const normalizedLoc = filterLocation.toLowerCase();

    // 1. Filter Courses
    const matchingCourses = enrichedCourses.filter(course => {
      if (resultTypeFilter === 'colleges') return false; // Skip if only looking for colleges

      const matchesSearch = effectiveSearch === '' || 
        course.courseName.toLowerCase().includes(normalizedSearch) ||
        course.collegeName.toLowerCase().includes(normalizedSearch) ||
        course.description.toLowerCase().includes(normalizedSearch); // Search description
      
      const matchesLocation = filterLocation === '' || 
        course.location.toLowerCase().includes(normalizedLoc) ||
        course.state.toLowerCase().includes(normalizedLoc);

      return matchesSearch && matchesLocation;
    });

    // 2. Filter Colleges
    const matchingColleges = colleges.filter(college => {
      if (resultTypeFilter === 'courses') return false; // Skip if only looking for courses

      const matchesSearch = effectiveSearch === '' || 
        college.name.toLowerCase().includes(normalizedSearch) ||
        college.location.toLowerCase().includes(normalizedSearch) ||
        college.state.toLowerCase().includes(normalizedSearch) ||
        (college.description || '').toLowerCase().includes(normalizedSearch); // Search description
      
      const matchesLocation = filterLocation === '' || 
        college.location.toLowerCase().includes(normalizedLoc) ||
        college.state.toLowerCase().includes(normalizedLoc);

      return matchesSearch && matchesLocation;
    });

    // 3. Combine items with a type discriminator
    const combined = [
      ...matchingCourses.map(c => ({ type: 'course' as const, data: c })),
      ...matchingColleges.map(c => ({ type: 'college' as const, data: c }))
    ];

    // 4. Sort
    return combined.sort((a, b) => {
      if (sortBy === 'fees_low') {
        // Colleges go to bottom if sorting by fees, or treated as 0? Let's put them at bottom
        const feeA = a.type === 'course' ? a.data.fees : 999999999;
        const feeB = b.type === 'course' ? b.data.fees : 999999999;
        return feeA - feeB;
      }
      if (sortBy === 'fees_high') {
         const feeA = a.type === 'course' ? a.data.fees : -1;
         const feeB = b.type === 'course' ? b.data.fees : -1;
         return feeB - feeA;
      }
      if (sortBy === 'alpha_asc') {
        const nameA = a.type === 'course' ? a.data.courseName : a.data.name;
        const nameB = b.type === 'course' ? b.data.courseName : b.data.name;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'alpha_desc') {
        const nameA = a.type === 'course' ? a.data.courseName : a.data.name;
        const nameB = b.type === 'course' ? b.data.courseName : b.data.name;
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

  }, [enrichedCourses, colleges, searchTerm, aiKeyword, filterLocation, resultTypeFilter, sortBy]);

  // Auth Handlers
  const handleLogin = async (email: string, avatarUrl?: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    
    if (existingUser) {
      // STRICT ROLE VALIDATION
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(existingUser.role)) {
        console.error(`Login Denied: Role '${existingUser.role}' is invalid.`);
        alert('Access Denied: Your account has an invalid role assigned. Please contact the administrator.');
        return;
      }

      let currentUserToSet = existingUser;

      // Check if avatar needs updating (and ensure it's different to avoid loops/unnecessary saves)
      if (avatarUrl && existingUser.avatar !== avatarUrl) {
        console.log("Updating user avatar...");
        currentUserToSet = { ...existingUser, avatar: avatarUrl };
        
        // Update user list state and persist to backend
        const updatedUsers = users.map(u => 
          u.email.toLowerCase() === normalizedEmail ? currentUserToSet : u
        );
        setUsers(updatedUsers);
        await storageService.saveUsers(updatedUsers);
      }

      setUser(currentUserToSet);
      if (currentUserToSet.role === UserRole.ADMIN || currentUserToSet.role === UserRole.EDITOR) {
        setView('admin');
      } else {
        setView('home');
      }
    } else {
      alert('Access Denied: You are not an authorized admin or editor user.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  // --- CRUD HANDLERS (Wrappers) ---
  const handleAddCourse = async (course: Course) => {
    const updatedCourses = [course, ...courses];
    setCourses(updatedCourses); 
    await storageService.saveCourses(updatedCourses);
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    const updatedCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(updatedCourses);
    await storageService.saveCourses(updatedCourses);
  };

  const handleAddCollege = async (college: College) => {
    const updatedColleges = [college, ...colleges];
    setColleges(updatedColleges);
    await storageService.saveColleges(updatedColleges);
  };

  const handleUpdateCollege = async (updatedCollege: College) => {
    const updatedColleges = colleges.map(c => c.id === updatedCollege.id ? updatedCollege : c);
    setColleges(updatedColleges);
    await storageService.saveColleges(updatedColleges);
  };

  const handleAddUser = async (newUser: User) => {
    const normalizedNewUser = { ...newUser, email: newUser.email.toLowerCase().trim() };
    if (users.some(u => u.email.toLowerCase() === normalizedNewUser.email)) {
      alert('User already exists');
      return;
    }
    const updatedUsers = [...users, normalizedNewUser];
    setUsers(updatedUsers);
    await storageService.saveUsers(updatedUsers);
    alert('User added successfully');
  };

  // --- DELETE REQUEST HANDLERS ---
  const requestDeleteUser = (emailToDelete: string) => {
    if (!user) return;
    const normalizedEmailToDelete = emailToDelete.toLowerCase().trim();
    const normalizedCurrentUserEmail = user.email.toLowerCase().trim();
    if (normalizedCurrentUserEmail === normalizedEmailToDelete) {
      alert("You cannot delete your own account.");
      return;
    }
    setDeleteConfirmState({ isOpen: true, type: 'user', itemId: normalizedEmailToDelete, itemName: emailToDelete });
  };

  const requestDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      setDeleteConfirmState({ isOpen: true, type: 'course', itemId: id, itemName: course.courseName });
    }
  };

  const requestDeleteCollege = (id: string) => {
    const college = colleges.find(c => c.id === id);
    if (!college) return;

    // Check for blocking courses - Strict comparison
    const blockingCoursesCount = courses.filter(c => String(c.collegeId) === String(id)).length;
    
    if (blockingCoursesCount > 0) {
      console.log(`Validation Failed: College ${id} has ${blockingCoursesCount} courses.`);
      alert(`Cannot delete ${college.name}. It has ${blockingCoursesCount} existing course(s). Please delete all associated courses first.`);
      return;
    }

    setDeleteConfirmState({ isOpen: true, type: 'college', itemId: id, itemName: college.name });
  };

  // --- DELETE EXECUTION ---
  const performDelete = async () => {
    const { type, itemId } = deleteConfirmState;
    if (!type || !itemId) return;

    // Optimistic UI: Close modal immediately so UI feels responsive
    setDeleteConfirmState({ isOpen: false, type: null, itemId: null });

    try {
      if (type === 'user') {
        const updatedUsers = users.filter(u => u.email.toLowerCase().trim() !== itemId);
        setUsers(updatedUsers);
        await storageService.saveUsers(updatedUsers);
      } else if (type === 'course') {
        const updatedCourses = courses.filter(c => c.id !== itemId);
        setCourses(updatedCourses);
        await storageService.saveCourses(updatedCourses);
      } else if (type === 'college') {
        const updatedColleges = colleges.filter(c => c.id !== itemId);
        setColleges(updatedColleges);
        await storageService.saveColleges(updatedColleges);
      }
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to sync deletion with backend. The item might reappear on refresh.");
    } finally {
       // Just in case anything goes wrong, ensure state is cleared
       setDeleteConfirmState({ isOpen: false, type: null, itemId: null });
    }
  };

  const handleBulkUpload = async (newItems: any[], type: 'courses' | 'colleges' | 'users') => {
    // Overwrite existing data with new data from Excel
    if (type === 'courses') {
      const updatedCourses = newItems;
      setCourses(updatedCourses);
      await storageService.saveCourses(updatedCourses);
    } else if (type === 'colleges') {
      const updatedColleges = newItems;
      setColleges(updatedColleges);
      await storageService.saveColleges(updatedColleges);
    } else if (type === 'users') {
      const updatedUsers = newItems;
      setUsers(updatedUsers);
      await storageService.saveUsers(updatedUsers);
    }
  };

  const handleAiSearch = async (overrideTerm?: string) => {
    const termToUse = overrideTerm || searchTerm;
    if (!termToUse) return;
    setIsAiSearching(true);
    const filters = await parseSearchQuery(termToUse);
    setIsAiSearching(false);
    if (filters) {
      if (filters.location) setFilterLocation(filters.location);
      if (filters.keyword) {
        setAiKeyword(filters.keyword); // Use separated state, do not overwrite searchTerm
      }
    }
  };

  // --- CLICK HANDLERS FOR RESULTS ---
  
  const handleCourseClick = (course: EnrichedCourse) => {
    // When clicking a course, we want to open modal in 'course' view.
    // We also need to find the parent college to populate the list view if user goes back.
    const parentCollege = colleges.find(c => c.id === course.collegeId);
    if (!parentCollege) return;

    setModalState({
      isOpen: true,
      viewMode: 'course',
      selectedCollege: parentCollege,
      selectedCourse: course
    });
  };

  const handleCollegeClick = (college: College) => {
    // When clicking a college, we open modal in 'college' view (List).
    setModalState({
      isOpen: true,
      viewMode: 'college',
      selectedCollege: college,
      selectedCourse: null
    });
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium font-serif">Loading Direct-Admission Portal...</p>
      </div>
    );
  }

  // Derived state for Modal Data
  const modalCourses = modalState.selectedCollege 
    ? enrichedCourses.filter(c => c.collegeId === modalState.selectedCollege!.id)
    : [];

  // Dynamic Year Calculation
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        user={user} 
        onLoginClick={() => setView('login')} 
        onLogoutClick={handleLogout}
        onNavigate={setView}
        currentView={view}
      />

      <main className="flex-grow pb-12">
        {view === 'home' && (
          <div>
            {/* HERO SECTION - Institutional Design */}
            <div className="relative bg-slate-900 pb-28 pt-20 px-4 overflow-hidden border-b-8 border-amber-500">
               {/* Overlay Pattern */}
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
               <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-900 opacity-90"></div>
               
               <div className="max-w-5xl mx-auto text-center relative z-10">
                 <span className="inline-block py-1 px-3 rounded-full bg-blue-800/50 border border-blue-700 text-blue-200 text-xs font-semibold tracking-wider mb-4 uppercase">
                    Admissions Open for {currentYear}-{nextYear}
                 </span>
                 <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-serif leading-tight">
                   Secure Your Seat in <br/> <span className="text-amber-400">West Bengal's Top Institutes</span>
                 </h2>
                 <p className="text-slate-300 mb-10 text-lg md:text-xl font-light max-w-3xl mx-auto">
                   The official portal for direct curriculum discovery and admission support across verified colleges in West Bengal.
                 </p>
                 
                 <div className="bg-white p-3 rounded-lg shadow-xl flex gap-3 max-w-2xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
                   <div className="flex-grow relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                     </div>
                     <input 
                        type="text" 
                        placeholder="Search courses, colleges, or exams..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setAiKeyword(null); // Reset AI smarts when user types manually
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                        className="w-full p-4 pl-10 pr-24 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 placeholder-slate-500 font-medium text-sm md:text-base"
                     />
                     
                     <div className="absolute right-2 top-3 flex items-center gap-1">
                        <button
                          onClick={startVoiceSearch}
                          className={`p-2 rounded-full transition-colors ${isVoiceListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                          title="Search by Voice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                        {process.env.REACT_APP_GEMINI_API_KEY && (
                          <button 
                            onClick={() => handleAiSearch()}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                            title="AI Search Assistant"
                          >
                            <svg className={`w-5 h-5 ${isAiSearching ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </button>
                        )}
                     </div>
                   </div>
                 </div>

                 <p className="text-slate-400 text-xs mt-3 font-sans opacity-90">
                   <span className="text-amber-400 font-semibold">✨ AI Tip:</span> You can type naturally, e.g., "Best B.Tech colleges in Kolkata"
                 </p>
               </div>
               
               {/* Trust Statistics Bar */}
               <div className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-slate-700/50 pt-8">
                  <div>
                    <div className="text-2xl font-bold text-white font-serif">{colleges.length > 0 ? `${colleges.length}+` : '0+'}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Institutes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-serif">{courses.length > 0 ? `${courses.length}+` : '0+'}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Courses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-serif">100%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Verified Data</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-serif">24/7</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Support</div>
                  </div>
               </div>
            </div>

            {/* Results Filter & Sort Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-8">
              <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-3 flex flex-row flex-nowrap justify-between items-center gap-3">
                
                {/* Desktop/Tablet Type Toggles */}
                <div className="hidden sm:flex bg-slate-100 p-1 rounded-md overflow-x-auto no-scrollbar">
                   <button 
                    onClick={() => setResultTypeFilter('colleges')}
                    className={`px-4 py-2 text-sm font-semibold rounded transition-all whitespace-nowrap ${resultTypeFilter === 'colleges' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     Institutes Only
                   </button>
                   <button 
                    onClick={() => setResultTypeFilter('courses')}
                    className={`px-4 py-2 text-sm font-semibold rounded transition-all whitespace-nowrap ${resultTypeFilter === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     Programs Only
                   </button>
                   <button 
                    onClick={() => setResultTypeFilter('all')}
                    className={`px-4 py-2 text-sm font-semibold rounded transition-all whitespace-nowrap ${resultTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     All Results
                   </button>
                </div>

                {/* Mobile Type Dropdown */}
                <div className="sm:hidden flex-grow min-w-[120px]">
                  <select
                    value={resultTypeFilter}
                    onChange={(e) => setResultTypeFilter(e.target.value as any)}
                    className="w-full py-2.5 pl-3 pr-8 text-sm border border-slate-200 bg-slate-50 rounded font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="colleges">Institutes Only</option>
                    <option value="courses">Programs Only</option>
                    <option value="all">View All</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex-shrink-0 min-w-[150px]">
                   <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full py-2.5 pl-3 pr-8 text-sm border border-slate-200 bg-white rounded outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 font-semibold appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                   >
                     <option value="alpha_asc">Name: A → Z</option>
                     <option value="alpha_desc">Name: Z → A</option>
                     {resultTypeFilter !== 'colleges' && <option value="fees_low">Fees: Lowest First</option>}
                     {resultTypeFilter !== 'colleges' && <option value="fees_high">Fees: Highest First</option>}
                   </select>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 min-h-[400px]">
              {filteredResults.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center max-w-lg mx-auto mt-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif mb-2">No matching results found</h3>
                  <p className="text-slate-500 mb-6">We couldn't find any colleges or courses matching your specific criteria. Try broadening your search.</p>
                  <button 
                    onClick={() => {setSearchTerm(''); setFilterLocation(''); setResultTypeFilter('colleges');}}
                    className="px-5 py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    Clear Search Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredResults.map((item, idx) => {
                    if (item.type === 'course') {
                      return (
                        <CourseCard 
                          key={`course-${item.data.id}`} 
                          course={item.data as EnrichedCourse} 
                          onClick={() => handleCourseClick(item.data as EnrichedCourse)}
                        />
                      );
                    } else {
                      return (
                        <CollegeCard
                          key={`college-${item.data.id}`}
                          college={item.data as College}
                          onClick={() => handleCollegeClick(item.data as College)}
                        />
                      );
                    }
                  })}
                </div>
              )}
            </div>

            {/* Value Proposition Section */}
            <div className="bg-white py-16 mt-16 border-t border-slate-200">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                   <h2 className="text-3xl font-bold text-slate-900 font-serif mb-4">Why Direct-Admission?</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">We are India's only transparent, automated portal connecting students directly with institution administrations.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center hover:shadow-md transition-shadow">
                       <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🛡️</div>
                       <h3 className="font-bold text-lg mb-2 text-slate-900">100% Secure</h3>
                       <p className="text-sm text-slate-600">Your data is encrypted and sent directly to the college admission cell. No third-party agents.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center hover:shadow-md transition-shadow">
                       <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">⚡</div>
                       <h3 className="font-bold text-lg mb-2 text-slate-900">Direct Process</h3>
                       <p className="text-sm text-slate-600">Skip the queues and confusing paperwork. Get clear, direct information about fees and eligibility.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center hover:shadow-md transition-shadow">
                       <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">💰</div>
                       <h3 className="font-bold text-lg mb-2 text-slate-900">No Hidden Fees</h3>
                       <p className="text-sm text-slate-600">We show you the exact total fees approved by the institute. What you see is what you pay.</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {view === 'login' && (
          <Login onLogin={handleLogin} />
        )}

        {view === 'admin' && user && (
          <AdminDashboard 
            currentUser={user}
            courses={courses}
            colleges={colleges}
            users={users}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={requestDeleteCourse}
            onAddUser={handleAddUser}
            onDeleteUser={requestDeleteUser}
            onBulkUpload={handleBulkUpload}
            onAddCollege={handleAddCollege}
            onUpdateCollege={handleUpdateCollege}
            onDeleteCollege={requestDeleteCollege}
            onRefreshData={handleManualRefresh}
          />
        )}
      </main>
      
      {/* Unified Course/College Modal */}
      {modalState.isOpen && modalState.selectedCollege && (
        <DetailsModal 
          initialView={modalState.viewMode}
          selectedCourse={modalState.selectedCourse}
          collegeData={modalState.selectedCollege}
          collegeCourses={modalCourses}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
        />
      )}

      {/* Unified Delete Confirmation Modal */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmState({ isOpen: false, type: null, itemId: null })}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative z-10 animate-scaleIn">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Are you sure you want to delete 
              {deleteConfirmState.type === 'user' && <strong> user {deleteConfirmState.itemName}</strong>}
              {deleteConfirmState.type === 'course' && <strong> course "{deleteConfirmState.itemName}"</strong>}
              {deleteConfirmState.type === 'college' && <strong> college "{deleteConfirmState.itemName}"</strong>}
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmState({ isOpen: false, type: null, itemId: null })}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={performDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors shadow-sm text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
           <div>
              <h4 className="text-white font-bold font-serif mb-4 text-lg">Direct-Admission</h4>
              <p className="mb-4">The most trusted gateway for direct college admissions in India. Connecting dreams with destinations.</p>
           </div>
           <div>
              <h5 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Quick Links</h5>
              <ul className="space-y-2">
                 <li><button className="hover:text-amber-500 transition-colors">About Us</button></li>
                 <li><button className="hover:text-amber-500 transition-colors">Contact Support</button></li>
                 <li><button className="hover:text-amber-500 transition-colors">Privacy Policy</button></li>
                 <li><button className="hover:text-amber-500 transition-colors">Terms of Service</button></li>
              </ul>
           </div>
           <div>
              <h5 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">For Colleges</h5>
              <ul className="space-y-2">
                 <li><button className="hover:text-amber-500 transition-colors">Partner With Us</button></li>
                 <li><button className="hover:text-amber-500 transition-colors">Admin Login</button></li>
                 <li><button className="hover:text-amber-500 transition-colors">Verify Data</button></li>
              </ul>
           </div>
           <div>
              <h5 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Contact</h5>
              <p className="mt-2 text-amber-500">{CONTACT_EMAIL}</p>
              {/* Updated Contact Number with hyphen format */}
              <p className="mt-1">Phone: +91-{CONTACT_PHONE.slice(0, 5)}-{CONTACT_PHONE.slice(5)}</p>
           </div>
        </div>
        <div className="text-center pt-8 border-t border-slate-800 text-xs">
          <p>&copy; {new Date().getFullYear()} Direct-Admission India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
