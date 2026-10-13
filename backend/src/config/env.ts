import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const PORT = parseInt(process.env.PORT || '5000', 10);
export const MONGODB_URI = process.env.MONGODB_URI || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export const BASE_DIR = path.resolve(__dirname, '../..');
export const UPLOAD_DIR = path.resolve(BASE_DIR, 'uploads');
export const TEMP_EXTRACT_DIR = path.resolve(BASE_DIR, 'temp_extracted');
export const REPORTS_DIR = path.resolve(BASE_DIR, 'reports');

// Ensure necessary storage directories exist
[UPLOAD_DIR, TEMP_EXTRACT_DIR, REPORTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
