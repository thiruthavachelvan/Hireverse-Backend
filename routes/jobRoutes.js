const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  getCompanyJobs,
  toggleJobActive,
} = require('../controllers/jobController');
const { protect, companyOnly } = require('../middleware/authMiddleware');

router.post('/', protect, companyOnly, createJob);
router.get('/', protect, getAllJobs);
router.get('/company', protect, companyOnly, getCompanyJobs);
router.get('/:id', protect, getJobById);
router.put('/:id/toggle-active', protect, companyOnly, toggleJobActive);

module.exports = router;
