const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');

// Выполнение кода
router.post('/execute', codeController.executeCode);

// Получение истории выполнения кода
router.get('/sessions/:sessionId/executions', codeController.getExecutionHistory);

module.exports = router;