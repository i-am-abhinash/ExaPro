import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { UPLOAD_DIR } from '../config/env';
import {
  uploadZipProject,
  submitGitHubProject,
  listProjects,
  getProjectById,
  getProjectReport,
  downloadProjectDocx,
  downloadProjectFaultReportDocx,
  getProjectTestRun,
  getProjectFindings,
  getProjectFaultReportJson,
  deleteProject,
} from '../controllers/projectController';

const router = Router();

// Multer storage configuration for ZIP files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum zip size
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return cb(new Error('Invalid file type. Only .zip archives are supported.'));
    }
    cb(null, true);
  },
});

// Submission endpoints
router.post('/upload', upload.single('file'), uploadZipProject);
router.post('/github', submitGitHubProject);

// Query & Technical Report endpoints
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.get('/:id/report', getProjectReport);
router.get('/:id/download', downloadProjectDocx);

// Automated Testing & Fault Report endpoints
router.get('/:id/test-run', getProjectTestRun);
router.get('/:id/findings', getProjectFindings);
router.get('/:id/fault-report/docx', downloadProjectFaultReportDocx);
router.get('/:id/fault-report/json', getProjectFaultReportJson);

router.delete('/:id', deleteProject);

export default router;
