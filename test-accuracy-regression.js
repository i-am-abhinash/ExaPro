const fs = require('fs');
const path = require('path');
const AdmZip = require(path.join(__dirname, 'backend', 'node_modules', 'adm-zip'));

const BASE_URL = 'http://localhost:5000/api';

async function createClubAttendanceZip() {
  const zipPath = path.join(__dirname, 'test-club-attendance.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const zip = new AdmZip();
  const sourceDir = 'd:\\Mitra\\club-attendance-app';

  const ignoreDirs = new Set(['node_modules', 'dist', '.firebase', '.git', '.vscode']);

  function addFolderRecursively(currentPath, zipPathPrefix) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.oxlintrc.json') {
        continue;
      }
      const fullPath = path.join(currentPath, entry.name);
      const zipEntryName = zipPathPrefix ? `${zipPathPrefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          addFolderRecursively(fullPath, zipEntryName);
        }
      } else {
        // Skip huge binary excel files for the test zip to keep upload fast
        if (!entry.name.endsWith('.xlsx')) {
          zip.addLocalFile(fullPath, zipPathPrefix || '');
        }
      }
    }
  }

  addFolderRecursively(sourceDir, '');
  zip.writeZip(zipPath);
  console.log(`[Setup] Created test-club-attendance.zip (${fs.statSync(zipPath).size} bytes)`);
  return zipPath;
}

async function createSpaMinimalZip() {
  const zipPath = path.join(__dirname, 'test-spa-minimal.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const zip = new AdmZip();
  zip.addFile('package.json', Buffer.from(JSON.stringify({
    name: 'minimal-spa',
    version: '1.0.0',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    devDependencies: { vite: '^4.4.5', '@vitejs/plugin-react': '^4.0.3' }
  }, null, 2)));

  zip.addFile('vite.config.js', Buffer.from(`
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    export default defineConfig({ plugins: [react()] });
  `));

  zip.addFile('index.html', Buffer.from(`
    <!DOCTYPE html><html><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>
  `));

  zip.addFile('src/main.jsx', Buffer.from(`
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  `));

  zip.addFile('src/App.jsx', Buffer.from(`
    import React, { useState } from 'react';
    export default function App() {
      const [count, setCount] = useState(0);
      return <div><button onClick={() => setCount(c => c + 1)}>Count: {count}</button></div>;
    }
  `));

  zip.writeZip(zipPath);
  console.log(`[Setup] Created test-spa-minimal.zip (${fs.statSync(zipPath).size} bytes)`);
  return zipPath;
}

async function createAmbiguousZip() {
  const zipPath = path.join(__dirname, 'test-ambiguous.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const zip = new AdmZip();
  zip.addFile('helpers.js', Buffer.from(`
    export function formatName(first, last) {
      return (first + ' ' + last).trim();
    }
  `));
  zip.addFile('notes.txt', Buffer.from('Miscellaneous utility functions without framework or manifest.'));

  zip.writeZip(zipPath);
  console.log(`[Setup] Created test-ambiguous.zip (${fs.statSync(zipPath).size} bytes)`);
  return zipPath;
}

async function uploadAndPoll(zipPath) {
  const formData = new FormData();
  const fileBytes = fs.readFileSync(zipPath);
  const blob = new Blob([fileBytes], { type: 'application/zip' });
  formData.append('file', blob, path.basename(zipPath));

  const uploadRes = await fetch(`${BASE_URL}/projects/upload`, {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed HTTP ${uploadRes.status}: ${errText}`);
  }

  const { projectId } = await uploadRes.json();
  console.log(`  Uploaded ${path.basename(zipPath)} -> Project ID: ${projectId}. Polling status...`);

  const startTime = Date.now();
  while (Date.now() - startTime < 120000) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BASE_URL}/projects/${projectId}`);
    const data = await res.json();
    const project = data.project;

    if (project && project.status === 'completed') {
      console.log(`  Project ${projectId} analysis completed in ${Math.round((Date.now() - startTime) / 1000)}s!`);
      return project;
    }

    if (project && project.status === 'failed') {
      throw new Error(`Project analysis failed: ${project.errorMessage}`);
    }
  }

  throw new Error(`Timed out waiting for project ${projectId}`);
}

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log('       EXAPRO ACCURACY REGRESSION TEST SUITE');
  console.log('===============================================================');

  let passedAssertions = 0;
  let totalAssertions = 0;

  function assert(condition, message) {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 1: ClubAttendance (Primary Regression Case)
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Testing ClubAttendance App (Regression Reference) ---');
  const clubZip = await createClubAttendanceZip();
  const clubProject = await uploadAndPoll(clubZip);

  console.log('\nInspecting ClubAttendance Structured Analysis:');
  const clubAnalysis = clubProject.structuredAnalysis;

  assert(Boolean(clubAnalysis), 'ClubAttendance structuredAnalysis exists in database');
  assert(clubProject.detectedTechnologies.frontend.includes('React'), 'React detected in frontend');
  assert(clubAnalysis.technologies.buildTools.includes('Vite'), 'Vite detected in buildTools');

  // Firebase Auth distinct detection
  assert(clubAnalysis.technologies.auth.includes('Firebase Authentication'), 'Firebase Authentication detected separately in auth');
  assert(clubProject.detectedTechnologies.auth.includes('Firebase Authentication'), 'Firebase Authentication surfaced on Project model');

  // Cloud Firestore database detection
  assert(clubAnalysis.technologies.database.some(d => d.includes('Cloud Firestore')), 'Cloud Firestore detected in database');
  assert(clubAnalysis.database.databaseType === 'cloud_firestore', 'Database model type is cloud_firestore');
  assert(clubAnalysis.database.isBaaS === true, 'Database correctly marked as BaaS');

  // Verify NO Express or backend server hallucination
  assert(!clubProject.detectedTechnologies.backend.includes('Express'), 'Express NOT hallucinated in backend');
  assert(clubProject.detectedTechnologies.backend.length === 0, 'No false backend server frameworks declared');

  // Verify NO in-memory or filesystem storage hallucination
  const dbSummary = clubAnalysis.database.summary.toLowerCase();
  assert(!dbSummary.includes('in-memory') && !dbSummary.includes('filesystem'), 'Database summary does NOT claim in-memory or filesystem storage');

  // Verify Firestore collections detected from firestore.rules and SDK calls
  const detectedCols = clubAnalysis.database.detectedCollectionsOrTables.map(c => c.name);
  console.log('  Detected Firestore collections:', detectedCols);
  assert(detectedCols.includes('attendance') || detectedCols.includes('users') || detectedCols.includes('members') || detectedCols.includes('teams'),
    'Real Firestore collections extracted from rules/SDK calls (found: ' + detectedCols.join(', ') + ')');

  // Architecture Model assertion
  assert(clubAnalysis.architecture.architectureType === 'client_baas', 'Architecture type is client_baas');
  assert(clubAnalysis.api.communicationModel === 'client_baas_sdk', 'Communication pattern is client_baas_sdk');

  // Coverage statistics & disclosure
  assert(clubAnalysis.coverage.totalDiscoveredFiles > 0, 'Discovered total files tracked');
  assert(clubAnalysis.coverage.inspectedFilesCount > 0, 'Inspected files tracked');
  assert(typeof clubAnalysis.coverage.limitationNotice === 'string', 'Limitation notice generated');

  // Architecture Diagram Buffer
  assert(Boolean(clubProject.architectureDiagramSvg), 'Architecture diagram SVG/PNG buffer generated');

  // DOCX Generation & Verification
  assert(Boolean(clubProject.reportFilePath) && fs.existsSync(clubProject.reportFilePath), 'DOCX file generated on disk at ' + clubProject.reportFilePath);

  // Inspect DOCX contents with AdmZip
  console.log('\nInspecting generated ClubAttendance DOCX package...');
  const docxZip = new AdmZip(clubProject.reportFilePath);
  const docXmlEntry = docxZip.getEntry('word/document.xml');
  assert(Boolean(docXmlEntry), 'word/document.xml exists in generated DOCX');

  const mediaEntry = docxZip.getEntries().find(e => e.entryName.startsWith('word/media/') && e.entryName.endsWith('.png'));
  assert(Boolean(mediaEntry), 'Architecture Diagram PNG embedded in DOCX (' + (mediaEntry ? mediaEntry.entryName : 'none') + ')');

  const docXmlText = docxZip.readAsText(docXmlEntry);
  assert(docXmlText.includes('Figure 6.1'), 'Figure 6.1 caption present in document.xml');
  assert(docXmlText.includes('Cloud Firestore'), 'Cloud Firestore referenced in document.xml');
  assert(docXmlText.includes('Firebase Authentication'), 'Firebase Authentication referenced in document.xml');
  assert(!docXmlText.includes('Express API server') && !docXmlText.includes('four-tier server'), 'No hallucinated Express server claims in document.xml');

  // --------------------------------------------------------------------------
  // TEST CASE 2: Express + MongoDB (TaskFlow)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Express + MongoDB Project (TaskFlow) ---');
  const taskflowZipPath = path.join(__dirname, 'test-taskflow.zip');
  const tfProject = await uploadAndPoll(taskflowZipPath);
  const tfAnalysis = tfProject.structuredAnalysis;

  assert(Boolean(tfAnalysis), 'Taskflow structuredAnalysis exists');
  assert(tfProject.detectedTechnologies.backend.includes('Express'), 'Express detected as backend');
  assert(tfProject.detectedTechnologies.database.includes('MongoDB'), 'MongoDB detected as database');
  assert(tfAnalysis.api.serverRestEndpoints.length > 0, 'REST API endpoints detected');
  assert(tfAnalysis.architecture.architectureType === 'client_server_db', 'Architecture type is client_server_db');

  // --------------------------------------------------------------------------
  // TEST CASE 3: Frontend-Only SPA (Minimal React Vite App)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Frontend-Only SPA ---');
  const spaZip = await createSpaMinimalZip();
  const spaProject = await uploadAndPoll(spaZip);
  const spaAnalysis = spaProject.structuredAnalysis;

  assert(Boolean(spaAnalysis), 'SPA structuredAnalysis exists');
  assert(spaProject.detectedTechnologies.frontend.includes('React'), 'React detected for SPA');
  assert(spaProject.detectedTechnologies.backend.length === 0, 'No backend server detected for SPA');
  assert(spaProject.detectedTechnologies.database.length === 0, 'No database detected for SPA');
  assert(spaAnalysis.architecture.architectureType === 'frontend_spa_only', 'Architecture type is frontend_spa_only');

  // --------------------------------------------------------------------------
  // TEST CASE 4: Ambiguous / Incomplete Project
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing Ambiguous / Incomplete Project ---');
  const ambZip = await createAmbiguousZip();
  const ambProject = await uploadAndPoll(ambZip);
  const ambAnalysis = ambProject.structuredAnalysis;

  assert(Boolean(ambAnalysis), 'Ambiguous project analysis exists');
  assert(ambProject.detectedTechnologies.backend.length === 0, 'No server hallucinated for ambiguous scripts');
  assert(ambProject.detectedTechnologies.database.length === 0, 'No database hallucinated for ambiguous scripts');
  assert(ambAnalysis.coverage.limitationNotice.length > 0, 'Uncertainty limitation notice disclosed');

  console.log('\n===============================================================');
  console.log(`ALL TESTS PASSED! (${passedAssertions}/${totalAssertions} assertions passed)`);
  console.log('===============================================================');
}

runRegressionSuite().catch(err => {
  console.error('\nTEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
