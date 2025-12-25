// stubs/api/routes/codeRoutes.js
const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'code-execution',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// POST /api/code/execute - Выполнение кода
router.post('/execute', (req, res) => {
  codeController.executeCode(req, res).then();
});

// GET /api/code/sessions/:sessionId/executions - История
router.get('/sessions/:sessionId/executions', (req, res) => {
  codeController.getExecutionHistory(req, res).then();
});

// GET /api/code/sessions/:sessionId/stats - Статистика
router.get('/sessions/:sessionId/stats', (req, res) => {
  codeController.getExecutionStats(req, res).then();
});

module.exports = router;