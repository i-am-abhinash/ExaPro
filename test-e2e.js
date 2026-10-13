const fs = require('fs');
const path = require('path');

async function runE2ETest() {
  console.log('=== Starting Exapro End-to-End Workflow Verification ===\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Check Health
  console.log('[Step 1] Checking /api/health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health Response:', JSON.stringify(healthData, null, 2));
  if (!healthData.database.isConnected) {
    throw new Error('Database is not connected!');
  }

  // 2. Upload ZIP Project
  console.log('\n[Step 2] Uploading test-taskflow.zip to /api/projects/upload...');
  const zipFilePath = path.join(__dirname, 'test-taskflow.zip');
  const fileBuffer = fs.readFileSync(zipFilePath);
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  const formData = new FormData();
  formData.append('file', blob, 'test-taskflow.zip');

  const uploadRes = await fetch(`${BASE_URL}/projects/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
  }
  const uploadData = await uploadRes.json();
  const projectId = uploadData.projectId;
  console.log(`Upload succeeded! Project ID: ${projectId}`);

  // 3. Poll Status until Completed
  console.log('\n[Step 3] Polling analysis status...');
  let status = 'queued';
  let project = null;
  let attempts = 0;
  while (status !== 'completed' && status !== 'failed' && attempts < 30) {
    attempts++;
    await new Promise((r) => setTimeout(r, 1000));
    const statusRes = await fetch(`${BASE_URL}/projects/${projectId}`);
    const resJson = await statusRes.json();
    project = resJson.project;
    status = project.status;
    console.log(`  [Attempt ${attempts}] Progress: ${project.progress}% | Status: ${project.status} | Msg: ${project.statusMessage}`);
  }

  if (status !== 'completed') {
    throw new Error(`Analysis failed or timed out: ${project?.errorMessage || 'Unknown error'}`);
  }
  console.log('Analysis completed successfully!');

  // 4. Verify Report Data
  console.log('\n[Step 4] Retrieving report data from /api/projects/:id/report...');
  const reportRes = await fetch(`${BASE_URL}/projects/${projectId}/report`);
  if (!reportRes.ok) {
    throw new Error(`Failed to fetch report (${reportRes.status})`);
  }
  const report = await reportRes.json();

  console.log('\n--- VERIFICATION OF EXTRACTED METRICS ---');
  console.log('Project Name:', report.projectName);
  console.log('Submission Type:', report.submissionType);
  console.log('Detected Languages:', report.detectedTechnologies.languages);
  console.log('Detected Frontend:', report.detectedTechnologies.frontend);
  console.log('Detected Backend:', report.detectedTechnologies.backend);
  console.log('Detected Database:', report.detectedTechnologies.database);
  console.log('Detected Testing:', report.detectedTechnologies.testTools);
  console.log('Detected API Endpoints:', report.apiEndpoints.map((e) => `${e.method} ${e.path}`));
  console.log('Detected Database Schemas:', report.databaseSchemas.map((s) => `${s.modelName} (fields: ${s.fields.map((f) => f.name).join(', ')})`));
  console.log('Architecture Diagram SVG Length:', report.architectureDiagramSvg?.length);
  console.log('AI Provider Used:', report.aiProviderUsed);
  console.log('Used AI Fallback:', report.usedAiFallback);

  // Assertions
  if (!report.architectureDiagramSvg || !report.architectureDiagramSvg.includes('<svg')) {
    throw new Error('FAIL: Architecture diagram SVG is missing or invalid!');
  }
  if (report.apiEndpoints.length === 0) {
    throw new Error('FAIL: API endpoints were not detected!');
  }
  if (report.databaseSchemas.length === 0) {
    throw new Error('FAIL: Database schemas were not detected!');
  }

  // 5. Verify DOCX Download
  console.log('\n[Step 5] Downloading DOCX report from /api/projects/:id/download...');
  const downloadRes = await fetch(`${BASE_URL}/projects/${projectId}/download`);
  if (!downloadRes.ok) {
    throw new Error(`DOCX download failed with status ${downloadRes.status}`);
  }
  const docxArrayBuffer = await downloadRes.arrayBuffer();
  const docxBuffer = Buffer.from(docxArrayBuffer);
  console.log(`Downloaded DOCX report size: ${docxBuffer.length} bytes`);

  const downloadedDocxPath = path.join(__dirname, 'downloaded_test_report.docx');
  fs.writeFileSync(downloadedDocxPath, docxBuffer);
  console.log(`Saved downloaded document to ${downloadedDocxPath}`);

  // Verify DOCX internal structure (it should be a valid zip archive containing word/document.xml and word/media/)
  const AdmZip = require('./backend/node_modules/adm-zip');
  const docxZip = new AdmZip(downloadedDocxPath);
  const docxEntries = docxZip.getEntries().map((e) => e.entryName);
  console.log('\nDOCX Archive Entries (Sample):', docxEntries.slice(0, 10));

  const hasDocumentXml = docxEntries.includes('word/document.xml');
  const hasEmbeddedMedia = docxEntries.some((e) => e.startsWith('word/media/'));

  console.log(`- Contains word/document.xml: ${hasDocumentXml}`);
  console.log(`- Contains embedded diagram image in word/media/: ${hasEmbeddedMedia}`);

  if (!hasDocumentXml) {
    throw new Error('FAIL: Downloaded file is not a valid DOCX document (missing word/document.xml)!');
  }
  if (!hasEmbeddedMedia) {
    throw new Error('FAIL: Architecture diagram image was not embedded inside the DOCX document!');
  }

  console.log('\nSUCCESS: Project ZIP submission, inspection, architecture synthesis, and DOCX embedding verified with 100% PASS!');
}

runE2ETest().catch((err) => {
  console.error('\nE2E TEST FAILURE:', err);
  process.exit(1);
});
