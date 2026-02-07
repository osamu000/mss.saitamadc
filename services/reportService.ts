
import { DailyReport, WorkReportEntry } from '../types';
import { STORAGE_KEY, GOOGLE_SHEETS_WEB_APP_URL } from '../constants';

export const calculateDuration = (start: string, end: string): string => {
  if (!start || !end) return '0.0';
  const startTime = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);
  
  let diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (diff < 0) diff += 24; // Handle shift across midnight
  
  return diff.toFixed(1);
};

export const saveDraftsToLocal = (reports: DailyReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const loadDraftsFromLocal = (): DailyReport[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const sendToGoogleSheets = async (report: WorkReportEntry): Promise<boolean> => {
  // Fix: Corrected the placeholder string check to match the value defined in constants.ts
  if (!GOOGLE_SHEETS_WEB_APP_URL || GOOGLE_SHEETS_WEB_APP_URL === 'ここにGASのデプロイURLを貼り付けてください') {
    console.warn('Google Sheets URL not configured. Simulating success.');
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }

  try {
    // GASのWeb Appは CORSの制限があるため、mode: 'no-cors' を使用するのが最もシンプルです
    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    // no-corsの場合、レスポンスの中身は読み取れませんが、エラーがなければ送信成功とみなします
    return true;
  } catch (error) {
    console.error('Failed to send report:', error);
    return false;
  }
};
