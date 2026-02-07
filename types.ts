
export enum Category {
  DEVELOPMENT = '開発',
  DESIGN = 'デザイン',
  MEETING = '会議',
  SUPPORT = 'サポート',
  OTHER = 'その他'
}

export interface WorkItem {
  id: string;
  category: Category;
  startTime: string;
  endTime: string;
  workDuration: string;
  content: string;
}

export interface DailyReport {
  id: string;
  workDate: string;
  workerName: string;
  items: WorkItem[];
  remarks: string;
  isApproved: boolean;
  createdAt: string;
}

export interface WorkReportEntry extends WorkItem {
  workDate: string;
  workerName: string;
  remarks: string;
  isApproved: boolean;
}
