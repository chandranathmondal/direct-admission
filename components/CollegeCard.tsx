
import React, { useState } from 'react';
import { College } from '../types';
import { getCollegeInsights } from '../services/geminiService';
import { CONTACT_PHONE } from '../constants';

interface CollegeCardProps {
  college: College;
  onClick?: () => void;
}

export const CollegeCard: React.FC<CollegeCardProps> = ({ college, onClick }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Fallback Logic: Use College specific phone if available, else global contact phone
  const displayPhone = college.phone || CONTACT_PHONE;

  const handleGetInsight = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insight) return;
    setLoadingInsight(true);
    // Include description in the AI context
    const text = await getCollegeInsights(college.name, college.location, college.description || '');
    setInsight(text);
    setLoadingInsight(false);
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden flex flex-col h-full group cursor-pointer relative"
    >
      {/* Metallic Gold Accent */}
      <div className="h-1.5 bg-gradient-to-r from-amber-600 to-amber-400"></div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex gap-4 items-start mb-4">
          <div className="flex-shrink-0 relative">
             <div className="w-16 h-16 rounded border border-slate-100 flex items-center justify-center overflow-hidden p-1 bg-white shadow-sm">
               {college.logoUrl ? (
                 <img src={college.logoUrl} alt={college.name} className="w-full h-full object-contain" />
               ) : (
                 <span className="text-2xl">🏛️</span>
               )}
             </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug font-serif">
              {college.name}
            </h3>
            
            <div className="flex flex-col gap-1 mt-2">
               <div className="flex items-center text-slate-600 text-xs font-medium font-sans">
                <svg className="w-3.5 h-3.5 mr-1.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {college.location}, {college.state}
              </div>
              <div className="flex items-center text-slate-600 text-xs font-medium font-sans">
                <svg className="w-3.5 h-3.5 mr-1.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                +91 {displayPhone}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex-grow relative">
           <div 
             className="text-slate-600 text-sm line-clamp-3 font-sans leading-relaxed [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
             dangerouslySetInnerHTML={{ __html: college.description || "Leading institute offering world-class education and research facilities." }}
           />
        </div>

        {insight && (
           <div className="mb-4 p-4 bg-amber-50 rounded border border-amber-100 text-sm text-slate-800 font-serif italic animate-fadeIn shadow-sm">
             <span className="font-bold not-italic text-amber-800 block text-xs mb-1 uppercase tracking-wide">AI College Summary</span>
             "{insight}"
           </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
           <button 
             onClick={handleGetInsight}
             disabled={loadingInsight}
             className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 rounded text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 group/btn"
           >
             {loadingInsight ? 'Thinking...' : 'AI Insights'}
             {!loadingInsight && (
                <svg className="w-3.5 h-3.5 text-amber-500 group-hover/btn:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             )}
           </button>
           
           <button className="text-sm font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 font-sans">
             View Programs <span aria-hidden="true">&rarr;</span>
           </button>
        </div>
      </div>
      
      {/* Verified Badge Overlay */}
      <div className="absolute top-0 right-0 bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-amber-100 uppercase tracking-wider">
        Verified
      </div>
    </div>
  );
};
