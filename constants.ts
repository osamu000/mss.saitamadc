
import { Category } from './types';

export const WORKERS = [
  '佐藤 一郎',
  '鈴木 幸子',
  '高橋 健二',
  '田中 美咲',
  '伊藤 直樹'
];

export const CATEGORIES = Object.values(Category);

export const STORAGE_KEY = 'work_report_drafts';

/**
 * 【重要】Google Apps Scriptで「デプロイ」して取得した「ウェブアプリURL」を
 * 下記の引用符の中に貼り付けてください。
 */
export const GOOGLE_SHEETS_WEB_APP_URL = 'ここにGASのデプロイURLを貼り付けてください';

/**
 * あなたのアプリのURL（GitHub PagesのURL）をメモとして残しておくと便利です
 * 例: https://ossamu000.github.io/mss.saitamadc/
 */
export const GITHUB_REPO_URL = window.location.origin + window.location.pathname;
