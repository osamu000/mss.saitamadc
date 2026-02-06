
import React from 'react';
import { Plus } from 'lucide-react';

interface TimeSummaryBarProps {
  totalHours: number;
  onAddRow: () => void;
}

const TimeSummaryBar: React.FC<TimeSummaryBarProps> = ({ totalHours, onAddRow }) => {
  // Assuming a standard 8 hour day for progress bar percentage
  const progress = Math.min((totalHours / 8) * 100, 100);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4 border-b border-indigo-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">本日の合計</span>
            <span className="text-3xl font-black text-indigo-600 font-mono">
              {totalHours.toFixed(1)} <small className="text-lg font-medium">h</small>
            </span>
          </div>

          <button 
            onClick={onAddRow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">行を追加</span>
          </button>
        </div>
        
        <div className="w-full md:flex-1 md:max-w-md bg-gray-100 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-500 ease-out flex items-center justify-end px-2"
            style={{ width: `${progress}%` }}
          >
            {progress > 15 && <span className="text-[10px] text-white font-bold">{Math.round(progress)}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSummaryBar;
