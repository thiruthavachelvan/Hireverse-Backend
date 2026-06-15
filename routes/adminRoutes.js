const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getProfessionals,
  verifyCompany,
  getStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly); // All admin routes require auth + admin role

router.get('/stats', getStats);
router.get('/companies', getCompanies);
router.get('/professionals', getProfessionals);
router.put('/companies/:id/verify', verifyCompany);

module.exports = router;
