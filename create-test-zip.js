const fs = require('fs');
const path = require('path');
const AdmZip = require('./backend/node_modules/adm-zip');

const zip = new AdmZip();

const pkgJson = {
  name: 'task-flow-service',
  version: '1.2.0',
  description: 'Enterprise task coordination and workflow dispatch service',
  main: 'src/server.ts',
  scripts: {
    start: 'node dist/server.js',
    dev: 'tsx watch src/server.ts',
    build: 'tsc',
    test: 'jest'
  },
  dependencies: {
    express: '^4.19.2',
    mongoose: '^8.3.1',
    cors: '^2.8.5',
    react: '^18.2.0',
    'react-dom': '^18.2.0'
  },
  devDependencies: {
    typescript: '^5.4.5',
    jest: '^29.7.0',
    vite: '^5.2.8'
  }
};

const readme = '# TaskFlow Service\n\nTaskFlow is a distributed workflow tracking system designed for agile development teams.\n\n## Setup\nRun npm install and npm run dev.';

const serverCode = `
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());

app.get('/api/tasks', (req, res) => res.json([]));
app.post('/api/tasks', (req, res) => res.status(201).json({ id: '1' }));
app.get('/api/tasks/:id', (req, res) => res.json({ id: req.params.id }));
app.delete('/api/tasks/:id', (req, res) => res.sendStatus(204));
`;

const modelCode = `
import mongoose, { Schema } from 'mongoose';
export const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true },
  dueDate: { type: Date }
});
export const Task = mongoose.model('Task', TaskSchema);
`;

const clientCode = `
import React from 'react';
export default function TaskList() {
  return <div>Task List Dashboard</div>;
}
`;

zip.addFile('package.json', Buffer.from(JSON.stringify(pkgJson, null, 2)));
zip.addFile('README.md', Buffer.from(readme));
zip.addFile('.env.example', Buffer.from('PORT=4000\nDATABASE_URL=mongodb://localhost:27017/taskflow\n'));
zip.addFile('src/server.ts', Buffer.from(serverCode));
zip.addFile('src/models/Task.ts', Buffer.from(modelCode));
zip.addFile('src/components/TaskList.tsx', Buffer.from(clientCode));
zip.addFile('src/tests/task.test.ts', Buffer.from('describe("Tasks", () => { test("dummy", () => {}); });'));

const zipPath = path.join(__dirname, 'test-taskflow.zip');
zip.writeZip(zipPath);
console.log('test-taskflow.zip generated at', zipPath);
