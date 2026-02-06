
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  User, 
  FileText, 
  Info, 
  Loader2,
  Plus
} from 'lucide-react';
import { WorkItem, Category } from './types';
import { WORKERS, CATEGORIES, STORAGE_KEY } from './constants';
import { calculateDuration, sendToGoogleSheets } from './services/reportService';

const App: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workerName, setWorkerName] = useState('');
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.workDate) setWorkDate(p.workDate);
        if (p.workerName) setWorkerName(p.workerName);
        if (p.remarks) setRemarks(p.remarks);
        if (p.items?.length > 0) setItems(p.items);
      } catch(e) { console.error("Restore failed", e); }
    }
  }, []);

  const totalHours = useMemo(() => {
    return items.reduce((acc, item) => acc + parseFloat(item.workDuration || '0'), 0);
  }, [items]);

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

  const handleSaveDraft = () => {
    const data = { workDate, workerName, items, remarks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert('入力内容をスマホに一時保存しました。');
  };

  const handleSend = async () => {
    if (!workerName.trim()) return alert('作業者名を入力してください');
    if (items.some(i => !i.content.trim())) return alert('作業内容を入力してください');
    
    setIsSubmitting(true);
    try {
      // 全ての行を1つずつ送信（GAS側で1行ずつ受け取る想定）
      for (const item of items) {
        await sendToGoogleSheets({
          ...item,
          workDate,
          workerName,
          remarks,
          isApproved: false
        });
      }
      
      // 送信成功後にクリア
      setItems([createEmptyItem()]);
      setRemarks('');
      localStorage.removeItem(STORAGE_KEY);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('エラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = "w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 transition-all";

  return (
    <div className="min-h-screen pb-40">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 leading-none">Total Hours</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-600 font-mono leading-none">{totalHours.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-slate-400">h</span>
            </div>
          </div>
          <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
            <Plus className="w-3.5 h-3.5" /> <span>追加</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min((totalHours / 8) * 100, 100)}%` }}></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 pt-20 space-y-3 fade-in">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase">
              <CalendarIcon className="w-3 h-3" /> 日付
            </label>
            <input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className={inputBaseClass} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase">
              <User className="w-3 h-3" /> 作業者
            </label>
            <div className="relative">
              <input 
                list="worker-datalist-global"
                value={workerName} 
                onChange={e => setWorkerName(e.target.value)}
                placeholder="名前入力/選択"
                className={inputBaseClass}
              />
              <datalist id="worker-datalist-global">
                {WORKERS.map(w => <option key={w} value={w} />)}
              </datalist>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-3 py-1.5 text-white flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Work Log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full compact-table">
              <thead className="bg-slate-50 text-slate-400 text-[8px] font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="col-time text-center">開始</th>
                  <th className="col-time text-center">終了</th>
                  <th className="col-dur text-center">稼働</th>
                  <th className="px-1">内容</th>
                  <th className="col-cat">カテゴリ</th>
                  <th className="col-del"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50">
                    <td className="col-time">
                      <input type="time" value={it.startTime} onChange={e => updateItem(it.id, { startTime: e.target.value })} className={inputBaseClass + " !py-1"} />
                    </td>
                    <td className="col-time">
                      <input type="time" value={it.endTime} onChange={e => updateItem(it.id, { endTime: e.target.value })} className={inputBaseClass + " !py-1"} />
                    </td>
                    <td className="col-dur text-center">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1 py-1 rounded border border-indigo-100 block">
                        {it.workDuration}
                      </span>
                    </td>
                    <td className="px-1">
                      <input 
                        list="content-datalist-global"
                        value={it.content} 
                        onChange={e => updateItem(it.id, { content: e.target.value })} 
                        placeholder="内容"
                        className={inputBaseClass + " !py-1 !font-medium"}
                      />
                    </td>
                    <td className="col-cat">
                      <select 
                        value={it.category} 
                        onChange={e => updateItem(it.id, { category: e.target.value as Category })}
                        className={inputBaseClass + " !py-1 bg-white"}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="col-del text-center">
                      <button onClick={() => removeItem(it.id)} disabled={items.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-0 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-slate-50/50 border-t border-slate-200 space-y-3">
            <textarea 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
              placeholder="備考（任意）" 
              rows={2} 
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-indigo-500 resize-none shadow-sm" 
            />
            <button onClick={handleSaveDraft} className="w-full py-2 bg-slate-700 text-white rounded-lg font-black text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
              <Save className="w-3 h-3 text-indigo-400" /> 入力内容を一時保存
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSend} 
            disabled={isSubmitting} 
            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
              isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-indigo-100'
            }`}
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> <span>送 信</span></>}
          </button>
        </div>
      </div>

      <datalist id="content-datalist-global">
        {['システム開発', 'バグ修正', '要件定義', '定例会議', 'クライアント対応', '資料作成', '環境構築'].map(s => <option key={s} value={s} />)}
      </datalist>

      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-black text-xs border border-indigo-500/30">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> 送信が完了しました
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
