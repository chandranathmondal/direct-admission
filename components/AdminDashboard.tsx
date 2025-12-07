
import React, { useState, useRef, useMemo } from 'react';
import { Course, User, UserRole, College } from '../types';
import { STATES_OF_INDIA } from '../constants';
import { RichTextEditor } from './RichTextEditor';

interface AdminDashboardProps {
  currentUser: User;
  courses: Course[];
  colleges: College[];
  users: User[];
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (email: string) => void;
  onBulkUpload: (items: any[], type: 'courses' | 'colleges' | 'users') => void;
  onAddCollege: (college: College) => void;
  onUpdateCollege: (college: College) => void;
  onDeleteCollege: (id: string) => void;
  onRefreshData: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, courses, colleges, users, 
  onAddCourse, onUpdateCourse, onDeleteCourse, 
  onAddUser, onDeleteUser, onBulkUpload,
  onAddCollege, onUpdateCollege, onDeleteCollege,
  onRefreshData
}) => {
  // 1. Tab Order: Colleges First
  const [activeTab, setActiveTab] = useState<'colleges' | 'courses' | 'users' | 'data'>('colleges');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- COURSE FORM STATE ---
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({});
  const selectedCollegeForCourse = colleges.find(c => c.id === newCourse.collegeId);
  const [courseSearchCollegeTerm, setCourseSearchCollegeTerm] = useState('');
  
  // --- COURSE TABLE STATE ---
  const [courseTableFilter, setCourseTableFilter] = useState('');

  // --- COLLEGE FORM STATE ---
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [newCollege, setNewCollege] = useState<Partial<College>>({
    state: 'West Bengal'
  });
  const [collegeLogoPreview, setCollegeLogoPreview] = useState<string>('');

  // --- USER FORM STATE ---
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.ADMIN);
  
  // --- BULK IMPORT STATE ---
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const MAX_DESCRIPTION_LENGTH = 50000;
  
  // Role Helpers
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isEditor = currentUser.role === UserRole.EDITOR;

  // --- Image Processing Logic ---
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 120; 
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCollegeLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processImage(file);
        setCollegeLogoPreview(base64);
        setNewCollege(prev => ({ ...prev, logoUrl: base64 }));
      } catch (err) {
        alert("Failed to process image");
      }
    }
  };

  // --- COLLEGE HANDLERS ---
  const handleEditCollegeClick = (college: College) => {
    setNewCollege(college);
    setCollegeLogoPreview(college.logoUrl || '');
    setEditingCollegeId(college.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCollegeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((newCollege.description?.length || 0) > MAX_DESCRIPTION_LENGTH) {
      alert(`Description exceeds the ${MAX_DESCRIPTION_LENGTH} character limit.`);
      return;
    }

    // Phone Number Validation: Either blank or exactly 10 digits
    if (newCollege.phone && newCollege.phone.length !== 10) {
      alert('Contact Phone must be either empty or exactly 10 digits.');
      return;
    }

    if (newCollege.name && newCollege.location && newCollege.state) {
      if (editingCollegeId) {
        onUpdateCollege({ ...newCollege, id: editingCollegeId } as College);
        alert('College updated successfully!');
      } else {
        onAddCollege({
          ...newCollege,
          id: 'col_' + Date.now(),
          rating: 0,
          ratingCount: 0,
          description: newCollege.description || ''
        } as College);
      }
      setEditingCollegeId(null);
      setNewCollege({ state: 'West Bengal' });
      setCollegeLogoPreview('');
    } else {
      alert('Please fill in Name, Location, and State.');
    }
  };

  // --- COURSE HANDLERS ---
  const handleEditCourseClick = (course: Course) => {
    setNewCourse(course);
    setEditingCourseId(course.id);
    
    // Find the college name to populate search box if needed, though we use ID
    const col = colleges.find(c => c.id === course.collegeId);
    if (col) setCourseSearchCollegeTerm(col.name);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCourse.collegeId) {
      alert("Please select a valid college from the list.");
      return;
    }

    if ((newCourse.description?.length || 0) > MAX_DESCRIPTION_LENGTH) {
      alert(`Description exceeds the ${MAX_DESCRIPTION_LENGTH} character limit.`);
      return;
    }

    if (newCourse.courseName && newCourse.fees !== undefined) {
      if (editingCourseId) {
        onUpdateCourse({ ...newCourse, id: editingCourseId } as Course);
        alert('Course updated successfully!');
      } else {
        onAddCourse({
          ...newCourse,
          id: Date.now().toString(),
          rating: 0,
          ratingCount: 0,
          duration: newCourse.duration || '4 Years',
          description: newCourse.description || ''
        } as Course);
      }
      setEditingCourseId(null);
      setNewCourse({});
      setCourseSearchCollegeTerm('');
    }
  };

  // --- USER HANDLERS ---
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail) {
      onAddUser({
        email: newUserEmail,
        name: newUserEmail.split('@')[0],
        role: newUserRole,
        avatar: `https://ui-avatars.com/api/?name=${newUserEmail}`
      });
      setNewUserEmail('');
    }
  };

  // --- BULK DATA HANDLERS ---
  const handleExportExcel = () => {
    const wb = (window as any).XLSX.utils.book_new();

    // 1. Colleges Sheet
    const collegeWS = (window as any).XLSX.utils.json_to_sheet(colleges);
    (window as any).XLSX.utils.book_append_sheet(wb, collegeWS, "Colleges");

    // 2. Courses Sheet (Map ID -> College Name for readability)
    const exportableCourses = courses.map(c => {
      const colName = colleges.find(col => col.id === c.collegeId)?.name || c.collegeId;
      return {
        ...c,
        college_name_reference: colName // Add helper column
      };
    });
    const courseWS = (window as any).XLSX.utils.json_to_sheet(exportableCourses);
    (window as any).XLSX.utils.book_append_sheet(wb, courseWS, "Courses");

    // 3. Users Sheet
    const userWS = (window as any).XLSX.utils.json_to_sheet(users);
    (window as any).XLSX.utils.book_append_sheet(wb, userWS, "Users");

    (window as any).XLSX.writeFile(wb, "DirectAdmission_FullData.xlsx");
  };

  const handleImportExcel = async () => {
    if (!excelFile) {
      setFileError("Please select an Excel (.xlsx) file first.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        
        // 1. Parse Colleges
        if (workbook.SheetNames.includes("Colleges")) {
          const ws = workbook.Sheets["Colleges"];
          const json = (window as any).XLSX.utils.sheet_to_json(ws);
          if (json) {
            onBulkUpload(json, 'colleges');
          }
        }

        // 2. Parse Courses
        if (workbook.SheetNames.includes("Courses")) {
          const ws = workbook.Sheets["Courses"];
          const json = (window as any).XLSX.utils.sheet_to_json(ws);
          
          // Re-map College Name to ID if needed (Advanced: This assumes IDs persist. Ideally we use IDs)
          // For now, we trust the ID field is present in the import.
          
          if (json) {
            onBulkUpload(json, 'courses');
          }
        }

        // 3. Parse Users
        if (workbook.SheetNames.includes("Users")) {
           const ws = workbook.Sheets["Users"];
           const json = (window as any).XLSX.utils.sheet_to_json(ws);
           if (json) {
             onBulkUpload(json, 'users');
           }
        }
        
        alert("Import Processed. Check lists for data.");
        setExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

      } catch (err) {
        console.error(err);
        setFileError("Failed to parse Excel file. Ensure structure is correct.");
      }
    };
    reader.readAsBinaryString(excelFile);
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setIsRefreshing(false);
  };

  // --- RENDER HELPERS ---
  const filteredCourses = useMemo(() => {
    if (!courseTableFilter) return courses;
    const lower = courseTableFilter.toLowerCase();
    return courses.filter(c => 
      c.courseName.toLowerCase().includes(lower) || 
      c.id.toLowerCase().includes(lower) ||
      colleges.find(col => col.id === c.collegeId)?.name.toLowerCase().includes(lower)
    );
  }, [courses, courseTableFilter, colleges]);

  const filteredCollegeOptions = useMemo(() => {
    if (!courseSearchCollegeTerm) return colleges.slice(0, 10);
    const lower = courseSearchCollegeTerm.toLowerCase();
    return colleges.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 10);
  }, [colleges, courseSearchCollegeTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 font-serif">Admin Dashboard</h2>
           <p className="text-slate-600 font-sans">Manage institutes, programs, and system users</p>
        </div>
        
        <div className="flex gap-3">
           <button 
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
           >
             <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             {isRefreshing ? 'Syncing...' : 'Sync / Refresh Data'}
           </button>
        </div>
      </div>
      
      {/* TABS */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8 overflow-hidden font-sans">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('colleges')}
            className={`flex-1 py-4 px-6 text-sm font-semibold text-center whitespace-nowrap transition-colors ${activeTab === 'colleges' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Manage Colleges
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-4 px-6 text-sm font-semibold text-center whitespace-nowrap transition-colors ${activeTab === 'courses' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Manage Courses
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 px-6 text-sm font-semibold text-center whitespace-nowrap transition-colors ${activeTab === 'users' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Manage Users
            </button>
          )}
          {isAdmin && (
             <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-4 px-6 text-sm font-semibold text-center whitespace-nowrap transition-colors ${activeTab === 'data' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Data Tools
            </button>
          )}
        </div>

        <div className="p-6">
          {/* ======================= MANAGE COLLEGES ======================= */}
          {activeTab === 'colleges' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 font-serif">{editingCollegeId ? 'Edit College' : 'Add New College'}</h3>
                <form onSubmit={handleCollegeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">College Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                        placeholder="e.g. Indian Institute of Technology"
                        value={newCollege.name || ''}
                        onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">City / Location</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                          placeholder="e.g. Kharagpur"
                          value={newCollege.location || ''}
                          onChange={(e) => setNewCollege({ ...newCollege, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">State</label>
                        <select
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                          value={newCollege.state || 'West Bengal'}
                          onChange={(e) => setNewCollege({ ...newCollege, state: e.target.value })}
                        >
                          {STATES_OF_INDIA.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Contact Phone</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                        placeholder="e.g. 9876543210"
                        value={newCollege.phone || ''}
                        onChange={(e) => {
                          // Validation: Only numeric, max 10 digits, no leading 0
                          const val = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (val.length > 10) return; // Max 10 digits
                          if (val.startsWith('0')) return; // Cannot start with 0
                          setNewCollege({ ...newCollege, phone: val });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">College Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 border border-slate-300 rounded-md bg-white flex items-center justify-center overflow-hidden">
                           {collegeLogoPreview ? (
                             <img src={collegeLogoPreview} alt="Preview" className="w-full h-full object-contain" />
                           ) : (
                             <span className="text-slate-300 text-xs">No Logo</span>
                           )}
                        </div>
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleCollegeLogoSelect}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                          />
                          <p className="text-xs text-slate-500 mt-1">Upload JPG/PNG. Auto-resized to 120px.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description - Rich Text */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Description (Bio)</label>
                    <RichTextEditor
                      value={newCollege.description || ''}
                      onChange={(html) => setNewCollege({ ...newCollege, description: html })}
                      placeholder="Write a brief overview about the college, campus life, and achievements..."
                      maxLength={MAX_DESCRIPTION_LENGTH}
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-200">
                    {editingCollegeId && (
                      <button
                        type="button"
                        onClick={() => {
                           setEditingCollegeId(null); 
                           setNewCollege({ state: 'West Bengal' });
                           setCollegeLogoPreview('');
                        }}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 shadow-sm font-medium text-sm transition-colors"
                    >
                      {editingCollegeId ? 'Update College' : 'Add College'}
                    </button>
                  </div>
                </form>
              </div>

              {/* College List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Institute Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Location</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {colleges.map((college) => (
                      <tr key={college.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded border border-slate-200 flex-shrink-0 flex items-center justify-center bg-white overflow-hidden mr-3">
                               {college.logoUrl ? <img src={college.logoUrl} className="w-full h-full object-contain" alt="" /> : "🏛️"}
                            </div>
                            <div className="text-sm font-medium text-slate-900 font-serif">{college.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {college.location}, {college.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditCollegeClick(college)}
                            className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                          >
                            Edit
                          </button>
                          {!isEditor && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCollege(college.id);
                              }}
                              className="text-red-600 hover:text-red-900 font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {colleges.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm italic">
                          No colleges added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= MANAGE COURSES ======================= */}
          {activeTab === 'courses' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 font-serif">{editingCourseId ? 'Edit Course' : 'Add New Course'}</h3>
                <form onSubmit={handleCourseSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Select College with basic search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Select College</label>
                    <div className="relative">
                      <input 
                        type="text"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                        placeholder="Search & Select College..."
                        value={courseSearchCollegeTerm}
                        onChange={(e) => {
                          setCourseSearchCollegeTerm(e.target.value);
                          if(e.target.value === '') setNewCourse({...newCourse, collegeId: ''});
                        }}
                      />
                      {courseSearchCollegeTerm && !selectedCollegeForCourse && (
                         <div className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                           {filteredCollegeOptions.map(col => (
                             <div 
                              key={col.id} 
                              className="p-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                              onClick={() => {
                                setNewCourse({...newCourse, collegeId: col.id});
                                setCourseSearchCollegeTerm(col.name);
                              }}
                             >
                               {col.name}
                             </div>
                           ))}
                           {filteredCollegeOptions.length === 0 && (
                             <div className="p-2 text-slate-400 text-sm italic">No colleges found</div>
                           )}
                         </div>
                      )}
                    </div>
                    {/* Read-only Location display */}
                    {selectedCollegeForCourse && (
                      <p className="mt-1 text-xs text-green-700 font-medium">
                        ✓ Selected: {selectedCollegeForCourse.name} ({selectedCollegeForCourse.location})
                      </p>
                    )}
                  </div>

                  {/* Course Details */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Course / Program Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                      placeholder="e.g. B.Tech Computer Science"
                      value={newCourse.courseName || ''}
                      onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Total Fees (₹)</label>
                    <input
                      type="text" 
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                      placeholder="e.g. 450000"
                      value={newCourse.fees !== undefined ? newCourse.fees : ''}
                      onChange={(e) => {
                        // Validation: Numeric, No decimal, No leading 0, Max length 7
                        const val = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        if (val.length > 7) return; // Max 7 digits
                        if (val.startsWith('0')) return; // No leading zero
                        
                        setNewCourse({ 
                          ...newCourse, 
                          fees: val === '' ? undefined : Number(val) 
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Duration</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                      placeholder="e.g. 4 Years"
                      value={newCourse.duration || ''}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    />
                  </div>

                  {/* Rich Text Editor for Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Curriculum & Description</label>
                    <RichTextEditor 
                      value={newCourse.description || ''}
                      onChange={(html) => setNewCourse({ ...newCourse, description: html })}
                      placeholder="Enter course details, syllabus highlights, and career prospects..."
                      maxLength={MAX_DESCRIPTION_LENGTH}
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-200">
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={() => {
                           setEditingCourseId(null); 
                           setNewCourse({});
                           setCourseSearchCollegeTerm('');
                        }}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 shadow-sm font-medium text-sm transition-colors"
                    >
                      {editingCourseId ? 'Update Course' : 'Add Course'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Course List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                   <h4 className="text-sm font-bold text-slate-700 font-serif">Course Directory</h4>
                   <input 
                    type="text" 
                    placeholder="Filter courses..." 
                    value={courseTableFilter}
                    onChange={(e) => setCourseTableFilter(e.target.value)}
                    className="text-xs p-1.5 rounded border border-slate-300 w-48 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                   />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Course Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">College</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Total Fees</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredCourses.map((course) => {
                        const col = colleges.find(c => c.id === course.collegeId);
                        return (
                          <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-serif">
                              {course.courseName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {col?.name || <span className="text-red-500">Unknown College ({course.collegeId})</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                              ₹{course.fees.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditCourseClick(course)}
                                className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                              >
                                Edit
                              </button>
                              {!isEditor && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCourse(course.id);
                                  }}
                                  className="text-red-600 hover:text-red-900 font-semibold"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCourses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm italic">
                            No courses found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= MANAGE USERS ======================= */}
          {activeTab === 'users' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 font-serif">Add New User</h3>
                <form onSubmit={handleUserSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-serif">Role</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-sm"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    >
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.EDITOR}>Editor</option>
                      <option value={UserRole.VIEWER}>Viewer</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto h-[40px] px-6 bg-blue-900 text-white rounded-md hover:bg-blue-800 shadow-sm font-medium text-sm transition-colors flex items-center justify-center whitespace-nowrap flex-shrink-0"
                  >
                    Add User
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div key={user.email} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center shadow-sm relative group hover:border-amber-300 transition-colors">
                    
                    {/* Delete Button - Absolute positioned to avoid layout overlap issues */}
                    {!isEditor && (
                       <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log("Delete button clicked for:", user.email);
                          onDeleteUser(user.email);
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors z-10"
                        title="Delete User"
                      >
                         <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}

                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-full border border-slate-100 shadow-sm mr-4"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-900 truncate font-serif">{user.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                        user.role === UserRole.EDITOR ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= DATA TOOLS ======================= */}
          {activeTab === 'data' && (
             <div className="space-y-8 animate-fadeIn">
               {/* 1. IMPORT SECTION */}
               <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-800 font-serif">Bulk Import Data</h3>
                       <p className="text-xs text-slate-500">Upload an Excel (.xlsx) file to overwrite the database.</p>
                     </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded border border-slate-200 border-dashed text-center">
                     <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".xlsx"
                      onChange={(e) => {
                         setExcelFile(e.target.files ? e.target.files[0] : null);
                         setFileError('');
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mx-auto max-w-sm mb-4"
                     />
                     {fileError && <p className="text-red-500 text-xs font-semibold mb-4">{fileError}</p>}
                     
                     <button
                      onClick={handleImportExcel}
                      disabled={!excelFile}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm transition-colors"
                     >
                       Import Data from Excel
                     </button>
                     <p className="mt-4 text-[10px] text-slate-400">
                       Note: The Excel file must have sheets named "Colleges", "Courses", and/or "Users". <br/>
                       <strong>Warning: This action will replace existing data.</strong>
                     </p>
                  </div>
               </div>

               {/* 2. EXPORT SECTION */}
               <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-4 w-full">
                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-800 font-serif">Export Database</h3>
                       <p className="text-xs text-slate-500">Download the full system data as a multi-sheet Excel file.</p>
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded border border-slate-200 flex flex-col items-center w-full">
                     <p className="text-sm text-slate-600 mb-6 text-center">
                       This will generate a single <strong>DirectAdmission_FullData.xlsx</strong> file containing all Colleges, Courses, and Users.
                     </p>
                     <button
                        onClick={handleExportExcel}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-medium text-sm transition-colors flex items-center gap-2"
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download Full Database (.xlsx)
                     </button>
                  </div>
               </div>
             </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};
