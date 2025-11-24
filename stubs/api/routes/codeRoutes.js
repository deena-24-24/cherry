const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { auth } = require('../middleware/authMiddleware');

// POST /api/code/execute - Выполнение кода
router.post('/execute', (req, res) => {
  console.log('📨 Received POST /api/code/execute');
  codeController.executeCode(req, res);
});

// GET /api/code/sessions/:sessionId/executions - Получение истории выполнения кода
router.get('/sessions/:sessionId/executions', (req, res) => {
  codeController.getExecutionHistory(req, res);
});

module.exports = router;