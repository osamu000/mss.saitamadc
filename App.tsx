
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  FileText, 
  ChevronDown,
  Lock
} from 'lucide-react';
import { DailyReport, WorkItem, Category, WorkReportEntry } from './types';
import { WORKERS, CATEGORIES, STORAGE_KEY } from './constants';
import { calculateDuration, sendToGoogleSheets } from './services/reportService';
import TimeSummaryBar from './components/TimeSummaryBar';

const App: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workerName, setWorkerName] = useState(WORKERS[0]);
  const [remarks, setRemarks] = useState('');
  
  const createEmptyItem = (): WorkItem => ({
    id: crypto.randomUUID(),
    category: Category.DEVELOPMENT,
    startTime: '09:00',
    endTime: '10:00',
    workDuration: '1.0',
    content: ''
  });

  const [items, setItems] = useState<WorkItem[]>([createEmptyItem()]);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) setReports(JSON.parse(data));
  }, []);

  const totalHours = useMemo(() => {
    const currentItemsTotal = items.reduce((acc, item) => acc + parseFloat(item.workDuration || '0'), 0);
    const savedReportsTotal = reports.reduce((acc, report) => 
      acc + report.items.reduce((sum, item) => sum + parseFloat(item.workDuration || '0'), 0)
    , 0);
    return currentItemsTotal + savedReportsTotal;
  }, [items, reports]);

  const updateItem = (id: string, updates: Partial<WorkItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        if (updates.startTime || updates.endTime) {
          newItem.workDuration = calculateDuration(newItem.startTime, newItem.endTime);
        }
        return newItem;
      }
      return item;
    }));
  };

  const addItem = useCallback(() => {
    const lastItem = items[items.length - 1];
    const newItem = createEmptyItem();
    if (lastItem) {
      newItem.startTime = lastItem.endTime;
      const [h, m] = lastItem.endTime.split(':').map(Number);
      const nextH = (h + 1) % 24;
      newItem.endTime = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      newItem.workDuration = calculateDuration(newItem.startTime, newItem.endTime);
    }
    setItems(prev => [...prev, newItem]);
  }, [items]);

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const handleSaveDraft = useCallback(() => {
    if (items.some(i => !i.content)) {
      alert('作業内容を入力してください');
      return;
    }
    const newReport: DailyReport = {
      id: crypto.randomUUID(),
      workDate,
      workerName,
      items,
      remarks,
      isApproved: false,
      createdAt: new Date().toISOString()
    };
    const updated = [...reports, newReport];
    setReports(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setItems([createEmptyItem()]);
    setRemarks('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [items, workDate, workerName, remarks, reports]);

  const handleDeleteReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleFinalSend = async () => {
    if (reports.length === 0) {
      alert('保存済みの記録がありません。まずは「一時保存」してください。');
      return;
    }
    setIsSubmitting(true);
    try {
      for (const report of reports) {
        for (const item of report.items) {
           const entry: WorkReportEntry = {
             ...item,
             workDate: report.workDate,
             workerName: report.workerName,
             remarks: report.remarks,
             isApproved: report.isApproved
           };
           await sendToGoogleSheets(entry);
        }
      }
      setReports([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert('送信中にエラーが発生しました。設定URLが正しいか確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-40 text-slate-900">
      <TimeSummaryBar totalHours={totalHours} onAddRow={addItem} />

      <div className="max-w-6xl mx-auto px-4 pt-28 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> 作業開始日
              </label>
              <input 
                type="date" 
                value={workDate} 
                onChange={(e) => setWorkDate(e.target.value)} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4" /> 作業者
              </label>
              <div className="relative">
                <select 
                  value={workerName} 
                  onChange={(e) => setWorkerName(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                >
                  {WORKERS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4 text-white flex justify-between items-center">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> 作業内容の記録
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-[110px]">開始時間</th>
                  <th className="px-4 py-3 w-[110px]">終了時間</th>
                  <th className="px-4 py-3 w-[80px]">時間</th>
                  <th className="px-4 py-3">作業内容</th>
                  <th className="px-4 py-3 w-[160px]">カテゴリー</th>
                  <th className="px-4 py-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-4">
                      <input 
                        type="time" 
                        value={item.startTime} 
                        onChange={(e) => updateItem(item.id, { startTime: e.target.value })} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="time" 
                        value={item.endTime} 
                        onChange={(e) => updateItem(item.id, { endTime: e.target.value })} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-full p-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black text-center border border-indigo-100">
                        {item.workDuration}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        rows={1}
                        placeholder="何を行いましたか？"
                        value={item.content}
                        onChange={(e) => updateItem(item.id, { content: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[42px] overflow-hidden"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${target.scrollHeight}px`;
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select 
                        value={item.category} 
                        onChange={(e) => updateItem(item.id, { category: e.target.value as Category })} 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        disabled={items.length <= 1} 
                        className="text-slate-300 hover:text-red-500 disabled:opacity-0 transition-colors"
                        title="行を削除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-200 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">備考 / メモ</label>
                  <textarea
                    placeholder="特記事項があればこちらへ"
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between p-5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner opacity-60">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-sm font-bold text-slate-400 block">承認</span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">スプレッドシート側で管理</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={false} 
                    readOnly
                    disabled
                    className="w-6 h-6 rounded-lg border-slate-200 text-slate-200 cursor-not-allowed bg-slate-200" 
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSaveDraft}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              <Save className="w-6 h-6" /> この作業内容を一時保存
            </button>
          </div>
        </div>

        {reports.length > 0 && (
          <div className="space-y-4 pt-4 pb-12">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 px-2">
              <Clock className="w-5 h-5 text-indigo-600" /> 送信待ち ({reports.length}件)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-black text-slate-800 block">{report.workDate}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{report.workerName}</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black">
                      {report.items.reduce((sum, i) => sum + parseFloat(i.workDuration), 0).toFixed(1)}h
                    </div>
                  </div>
                  <div className="space-y-1">
                    {report.items.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-[10px] text-slate-500 truncate">• {item.content}</p>
                    ))}
                    {report.items.length > 2 && <p className="text-[10px] text-slate-300 italic">他 {report.items.length - 2}件...</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteReport(report.id)} 
                    className="absolute top-2 right-2 p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleFinalSend}
            disabled={isSubmitting || reports.length === 0}
            className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${
              reports.length > 0 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200 active:scale-[0.99]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-6 h-6" /> 
                スプレッドシートへ一括送信
              </>
            )}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 font-black">
            <CheckCircle2 className="w-7 h-7" /> 
            送信が完了しました！
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
