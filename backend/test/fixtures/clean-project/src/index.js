const express = require('express');
const { getGreeting } = require('./utils');

const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', greeting: getGreeting('Developer') });
});

module.exports = app;
