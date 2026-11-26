import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomBytes, createHash } from 'crypto';
import { Project } from '../models/Project';
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
const GUEST_COOKIE = 'exapro_guest';

// Same-origin browser workspace. The raw 256-bit token stays in an HttpOnly
// cookie; only its SHA-256 digest is persisted on owned project records.
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.get('Sec-Fetch-Site') === 'cross-site') {
    res.status(403).json({ error: 'Cross-site project access is not allowed.' });
    return;
  }
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)exapro_guest=([a-f0-9]{64})(?:;|$)/);
  let token = match?.[1];
  if (!token && req.method === 'POST') {
    token = randomBytes(32).toString('hex');
    res.cookie(GUEST_COOKIE, token, {
      httpOnly: true, sameSite: 'strict', secure: req.secure,
      path: '/api/projects', maxAge: 90 * 24 * 60 * 60 * 1000,
    });
  }
  // Never match legacy ownerless records, including when a cookie is absent.
  res.locals.guestOwner = token ? createHash('sha256').update(token).digest('hex') : null;
  next();
});

// Every project-specific endpoint, including downloads, findings and deletion,
// must pass ownership validation before invoking its controller.
router.param('id', async (req, res, next, id) => {
  try {
    if (!res.locals.guestOwner || !/^[a-fA-F0-9]{24}$/.test(id)) {
      res.status(404).json({ error: 'Project not found.' }); return;
    }
    const owned = await Project.exists({ _id: id, guestOwner: res.locals.guestOwner });
    if (!owned) { res.status(404).json({ error: 'Project not found.' }); return; }
    next();
  } catch (err) { next(err); }
});


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
