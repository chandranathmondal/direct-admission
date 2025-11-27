import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, maxLength = 50000 }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentLength, setCurrentLength] = useState(0);

  // Sync external value changes to the editor (e.g. form reset)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === '') {
        editorRef.current.innerHTML = '';
      } else if (editorRef.current.innerHTML === '' && value) {
         editorRef.current.innerHTML = value;
      }
    }
    setCurrentLength(value.length);
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setCurrentLength(html.length);
      onChange(html);
    }
  };

  const ToolbarButton = ({ cmd, label, icon }: { cmd: string, label: string, icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => execCommand(cmd)}
      title={label}
      className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
    >
      {icon}
    </button>
  );

  const isOverLimit = currentLength > maxLength;

  return (
    <div className={`border rounded-lg overflow-hidden bg-white transition-all ${isOverLimit ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500'}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <ToolbarButton 
          cmd="bold" 
          label="Bold" 
          icon={<span className="font-bold font-serif text-lg leading-none">B</span>} 
        />
        <ToolbarButton 
          cmd="italic" 
          label="Italic" 
          icon={<span className="italic font-serif text-lg leading-none">I</span>} 
        />
        <ToolbarButton 
          cmd="underline" 
          label="Underline" 
          icon={<span className="underline font-serif text-lg leading-none">U</span>} 
        />
        <div className="w-px h-5 bg-slate-300 mx-1"></div>
        <ToolbarButton 
          cmd="insertUnorderedList" 
          label="Bullet List" 
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M4 6l-1 0M4 12l-1 0M4 18l-1 0" />
            </svg>
          } 
        />
        <ToolbarButton 
          cmd="insertOrderedList" 
          label="Numbered List" 
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h12M7 13h12M7 19h12M3 7l1 0M3 13l1 0M3 19l1 0" />
            </svg>
          } 
        />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 min-h-[150px] max-h-[300px] overflow-y-auto outline-none text-sm text-slate-800 prose prose-sm max-w-none bg-white"
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />
      
      {/* Character Counter */}
      <div className={`px-3 py-1 text-xs text-right border-t border-slate-100 font-mono bg-white ${isOverLimit ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
        HTML Chars: {currentLength.toLocaleString()} / {maxLength.toLocaleString()}
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
        }
        /* Basic formatting support inside editor */
        div[contenteditable] ul { list-style-type: disc; padding-left: 1.5rem; }
        div[contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; }
        div[contenteditable] b { font-weight: bold; }
        div[contenteditable] i { font-style: italic; }
      `}</style>
    </div>
  );
};