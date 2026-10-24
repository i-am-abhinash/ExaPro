const express = require('express');
const app = express();

app.get('/api/users', (req: any, res: any) => {
  res.json({ users: [] });
});

app.post('/api/auth/login', (req: any, res: any) => {
  res.json({ token: 'abc' });
});

module.exports = app;
