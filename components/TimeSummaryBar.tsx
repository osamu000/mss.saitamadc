
import React, { useState } from 'react';
import { Plus, Share2, Check } from 'lucide-react';

interface TimeSummaryBarProps {
  totalHours: number;
  onAddRow: () => void;
}

const TimeSummaryBar: React.FC<TimeSummaryBarProps> = ({ totalHours, onAddRow }) => {
  const [copied, setCopied] = useState(false);
  const progress = Math.min((totalHours / 8) * 100, 100);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm p-4 border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-indigo-600 font-mono">
              {totalHours.toFixed(1)} <small className="text-lg font-medium">h</small>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm font-bold ${
                copied 
                  ? 'bg-green-50 border-green-200 text-green-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="アプリのURLをコピー"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'コピー完了' : '共有'}</span>
            </button>
            
            <button 
              onClick={onAddRow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">行を追加</span>
            </button>
          </div>
        </div>
        
        <div className="w-full md:flex-1 md:max-w-md bg-slate-100 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-700 ease-out flex items-center justify-end px-2"
            style={{ width: `${progress}%` }}
          >
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSummaryBar;
