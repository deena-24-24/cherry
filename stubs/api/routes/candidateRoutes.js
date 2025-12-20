const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/authMiddleware');
const resumeController = require('../controllers/resumeController');

router.get('/resumes', auth, requireRole(['candidate']), resumeController.getMyResumes);
router.post('/resumes', auth, requireRole(['candidate']), resumeController.createResume);
router.put('/resumes/:id', auth, requireRole(['candidate']), resumeController.updateResume);
router.delete('/resumes/:id', auth, requireRole(['candidate']), resumeController.deleteResume);

module.exports = router;