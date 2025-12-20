const express = require('express');
const router = express.Router();
const saluteController = require('../controllers/saluteController');
const { auth } = require('../middleware/authMiddleware');

// Text-to-Speech
router.post('/synthesize', auth, saluteController.synthesize);

// Speech-to-Text
router.post('/recognize', auth, express.raw({
  type: ['audio/*', 'application/octet-stream'],
  limit: '10mb'
}), saluteController.recognize);

module.exports = router;