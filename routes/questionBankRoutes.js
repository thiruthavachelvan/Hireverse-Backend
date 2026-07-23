const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  getAnalytics,
  generateAssessment,
} = require('../controllers/questionBankController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getQuestions);
router.get('/analytics', protect, getAnalytics);
router.post('/generate', protect, generateAssessment);
router.get('/:id', protect, getQuestionById);

// Admin restricted operations
router.post('/', protect, adminOnly, createQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);
router.post('/import', protect, adminOnly, importQuestions);

module.exports = router;
