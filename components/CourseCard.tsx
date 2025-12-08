
import React, { useState } from 'react';
import { EnrichedCourse } from '../types';
import { getCourseInsights } from '../services/geminiService';
import { CONTACT_PHONE } from '../constants';

interface CourseCardProps {
  course: EnrichedCourse;
  onClick?: (course: EnrichedCourse) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Fallback Logic: Use College specific phone if available, else global contact phone
  const displayPhone = course.collegePhone || CONTACT_PHONE;

  const handleGetInsight = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (insight) return;
    setLoadingInsight(true);
    // Added course.description to the call for better AI context
    const text = await getCourseInsights(course.courseName, course.collegeName, course.description);
    setInsight(text);
    setLoadingInsight(false);
  };

  return (
    <div 
      onClick={() => onClick && onClick(course)}
      className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col h-full group cursor-pointer relative"
    >
      {/* Oxford Blue Accent with Blue Gradient */}
      <div className="h-1.5 bg-gradient-to-r from-blue-800 to-blue-600"></div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex gap-4 items-start mb-4">
          <div className="flex-shrink-0">
             <div className="w-12 h-12 rounded border border-slate-100 flex items-center justify-center overflow-hidden p-1 bg-white shadow-sm">
               {course.logoUrl ? (
                 <img src={course.logoUrl} alt={course.collegeName} className="w-full h-full object-contain" />
               ) : (
                 <span className="text-xl">🎓</span>
               )}
             </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors leading-snug font-serif">
              {course.courseName}
            </h3>
            <p className="text-sm text-slate-600 font-serif italic mt-0.5">{course.collegeName}</p>
            
            <div className="flex flex-col gap-1 mt-2">
               <div className="flex items-center text-slate-500 text-xs font-medium font-sans">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {course.location}, {course.state}
               </div>

               <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="font-semibold">Duration:</span> {course.duration}
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="relative mb-5 flex-grow">
          <div 
            className="text-slate-600 text-sm line-clamp-3 overflow-hidden font-sans leading-relaxed [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
        </div>

        {insight && (
           <div className="mb-4 p-4 bg-amber-50 rounded border border-amber-100 text-sm text-slate-800 font-serif italic animate-fadeIn shadow-sm">
             <span className="font-bold not-italic text-amber-800 block text-xs mb-1 uppercase tracking-wide">AI Course Summary</span>
             "{insight}"
           </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Fees</p>
             <p className="text-lg font-bold text-slate-900 font-serif">₹ {course.fees.toLocaleString('en-IN')}</p>
          </div>
          <button 
            onClick={handleGetInsight}
            disabled={loadingInsight}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 group/btn"
          >
            {loadingInsight ? 'Thinking...' : 'AI Insights'}
            {!loadingInsight && (
               <svg className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
