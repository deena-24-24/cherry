const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { auth } = require('../middleware/authMiddleware');

// POST /api/code/execute - Выполнение кода
router.post('/execute', codeController.executeCode);

// GET /api/code/sessions/:sessionId/executions - Получение истории выполнения кода
router.get('/sessions/:sessionId/executions', auth, codeController.getExecutionHistory);

module.exports = router;