
import React, { useState, useEffect } from 'react';
import { EnrichedCourse, College } from '../types';
import { getCourseInsights } from '../services/geminiService';
import { CourseCard } from './CourseCard'; // Reuse CourseCard for list view
import { CONTACT_PHONE } from '../constants';

interface CourseModalProps {
  initialView: 'college' | 'course';
  selectedCourse?: EnrichedCourse | null;
  collegeData: College;
  collegeCourses: EnrichedCourse[];
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({ 
  initialView, 
  selectedCourse, 
  collegeData, 
  collegeCourses, 
  onClose
}) => {
  const [currentView, setCurrentView] = useState<'college' | 'course'>(initialView);
  const [activeCourse, setActiveCourse] = useState<EnrichedCourse | null>(selectedCourse || null);
  
  // AI Insight State
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Determine phone number to display/call: College specific or fallback to global contact
  const displayPhone = collegeData.phone || CONTACT_PHONE;

  const isCollegeView = currentView === 'college';

  // Close on Escape key and Lock Body Scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // Reset insight when active course changes
  useEffect(() => {
    setInsight(null);
  }, [activeCourse]);

  const handleGetInsight = async () => {
    if (insight || !activeCourse) return;
    setLoadingInsight(true);
    // Included course description in context
    const text = await getCourseInsights(activeCourse.courseName, activeCourse.collegeName, activeCourse.description);
    setInsight(text);
    setLoadingInsight(false);
  };

  const handleCourseClickFromList = (course: EnrichedCourse) => {
    setActiveCourse(course);
    setCurrentView('course');
    // Scroll to top of modal content
    const contentDiv = document.getElementById('modal-scroll-content');
    if (contentDiv) contentDiv.scrollTop = 0;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-scaleIn">
        
        {/* Header */}
        <div className={`relative p-6 text-white shrink-0 transition-colors duration-300 ${isCollegeView ? 'bg-gradient-to-r from-amber-700 to-amber-900' : 'bg-gradient-to-r from-blue-900 to-slate-800'}`}>
           {/* Top Right Close Button */}
           <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           
           <div className="flex gap-4 items-center">
             <div className="w-20 h-20 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
               {collegeData.logoUrl ? (
                 <img src={collegeData.logoUrl} alt={collegeData.name} className="w-full h-full object-contain" />
               ) : (
                 <span className="text-4xl">🎓</span>
               )}
             </div>
             <div>
               <h2 className="text-2xl font-bold leading-tight">
                 {currentView === 'course' && activeCourse ? activeCourse.courseName : collegeData.name}
               </h2>
               
               {/* Context Navigation */}
               {currentView === 'course' && initialView === 'college' ? (
                 <button 
                  onClick={() => setCurrentView('college')}
                  className="text-blue-200 font-medium text-lg mt-1 hover:text-white hover:underline text-left transition-colors flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                   Back to {collegeData.name} Courses
                 </button>
               ) : (
                 <p className={`font-medium mt-1 flex items-center gap-1 ${isCollegeView ? 'text-white/90' : 'text-blue-200'}`}>
                   <svg className={`w-4 h-4 ${isCollegeView ? 'text-blue-300' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   <span>{collegeData.location}, {collegeData.state}</span>
                   
                   {collegeData.mapUrl && (
                      <a 
                        href={collegeData.mapUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`text-xs ml-2 flex items-center gap-0.5 hover:underline transition-all ${isCollegeView ? 'text-amber-200 hover:text-white' : 'text-amber-400 hover:text-amber-300'}`}
                        title="View on Google Maps"
                      >
                         View in Google Map &rarr;
                      </a>
                   )}
                 </p>
               )}
             </div>
           </div>
        </div>

        {/* Scrollable Body */}
        <div id="modal-scroll-content" className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-slate-50">
          
          {currentView === 'college' && (
            <div className="animate-fadeIn space-y-6">
              {/* College Info */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-2">About the Institute</h3>
                 <div 
                   className="prose prose-sm max-w-none text-slate-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                   dangerouslySetInnerHTML={{ __html: collegeData.description || "No specific description available for this college." }}
                 />
              </div>

              {/* Course Grid */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{collegeCourses.length}</span>
                  Courses Offered
                </h3>
                
                {collegeCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collegeCourses.map(course => (
                      <div key={course.id} className="h-full">
                        <CourseCard 
                          course={course} 
                          onClick={() => handleCourseClickFromList(course)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-lg border border-slate-200 border-dashed">
                    <p className="text-slate-500">No courses listed for this college yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'course' && activeCourse && (
            <div className="animate-fadeIn max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                   <span className="block text-xs font-semibold text-slate-500 uppercase">Total Fees</span>
                   <span className="text-xl font-bold text-slate-900">₹{activeCourse.fees.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                   <span className="block text-xs font-semibold text-slate-500 uppercase">Duration</span>
                   <span className="text-xl font-bold text-slate-900">{activeCourse.duration}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Course Curriculum & Details</h3>
                <div 
                  className="prose prose-sm md:prose-base max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-base font-normal"
                  dangerouslySetInnerHTML={{ __html: activeCourse.description }}
                />
              </div>

              {/* AI Insights Section */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-orange-800 font-bold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    AI Insights
                  </h4>
                  {!insight && (
                    <button 
                      onClick={handleGetInsight}
                      disabled={loadingInsight}
                      className="text-sm px-3 py-1 bg-white border border-orange-200 text-orange-600 rounded-md hover:bg-orange-100 transition-colors shadow-sm"
                    >
                      {loadingInsight ? 'Generating...' : 'Generate Insight'}
                    </button>
                  )}
                </div>
                
                {insight ? (
                  <p className="text-slate-700 italic leading-relaxed animate-fadeIn">
                    "{insight}"
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    Get a quick AI-generated summary about the career prospects and highlights of this program.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer with Book Your Seat Button (Centered) */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-center shrink-0">
          <a 
            href={`tel:+91${displayPhone}`}
            className={`px-8 py-3 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-lg transform hover:-translate-y-0.5 ${isCollegeView ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-700 hover:bg-blue-800'}`}
          >
            <span>📞</span> {currentView === 'college' ? 'Connect With College' : 'Book Your Seat'}
          </a>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};
