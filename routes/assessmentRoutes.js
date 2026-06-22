const express = require('express');
const router = express.Router();
const {
  getOrGenerateAssessment,
  submitAssessment,
  getAssessmentReport,
  getJobAssessmentResults,
  getAssessmentById
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/job/:jobId/round/:roundNumber', protect, getOrGenerateAssessment);
router.post('/:assessmentId/submit', protect, submitAssessment);
router.get('/:assessmentId/report', protect, getAssessmentReport);
router.get('/job/:jobId/results', protect, getJobAssessmentResults);
router.get('/:assessmentId', protect, getAssessmentById);

module.exports = router;
