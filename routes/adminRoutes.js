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

// ── Seed test data (admin only) ──────────────────────────────────────────────
router.post('/seed-test-data', async (req, res) => {
  try {
    const { runSeed } = require('../seedTestData');
    const results = await runSeed();
    res.json({ message: 'Test data seeded successfully', results });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ message: err.message || 'Seed failed' });
  }
});

module.exports = router;

