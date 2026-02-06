
import { WorkReportEntry } from '../types';
import { GOOGLE_SHEETS_WEB_APP_URL } from '../constants';

export const calculateDuration = (start: string, end: string): string => {
  if (!start || !end) return '0.0';
  const startTime = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);
  
  let diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (diff < 0) diff += 24; // 深夜またぎ対応
  
  return diff.toFixed(1);
};

export const sendToGoogleSheets = async (report: WorkReportEntry): Promise<boolean> => {
  // Convert to string to avoid TypeScript literal type comparison errors
  const url = String(GOOGLE_SHEETS_WEB_APP_URL);
  
  // URLが未設定、またはデフォルトのままの場合はシミュレーションを行う
  const isNotConfigured = !url || 
                          url === '' || 
                          url.includes('ここにGAS');

  if (isNotConfigured) {
    console.warn('Google Sheets URL is not configured. Simulating success.');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return true;
  }

  try {
    // no-corsモードで送信
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    return true;
  } catch (error) {
    console.error('Failed to send report:', error);
    return false;
  }
};
