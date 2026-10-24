const express = require('express');
const missingService = require('./services/missingService');
const lodash = require('lodash');

const app = express();

function doDangerousOperation() {
  try {
    const raw = JSON.parse('bad-json');
  } catch (e) {}
}

module.exports = app;
