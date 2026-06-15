const express = require('express');
const router = express.Router();
const {
  createApplication,
  acceptApplication,
  rejectApplication,
  scheduleRound,
  advanceRound,
  markHired,
  getUserApplications,
  getJobApplicants,
} = require('../controllers/applicationController');
const { protect, companyOnly, professionalOnly } = require('../middleware/authMiddleware');

router.post('/', protect, professionalOnly, createApplication);
router.get('/my-applications', protect, professionalOnly, getUserApplications);
router.get('/job/:jobId', protect, companyOnly, getJobApplicants);
router.put('/:id/accept', protect, companyOnly, acceptApplication);
router.put('/:id/reject', protect, companyOnly, rejectApplication);
router.put('/:id/schedule-round', protect, companyOnly, scheduleRound);
router.put('/:id/advance', protect, companyOnly, advanceRound);
router.put('/:id/hire', protect, companyOnly, markHired);

module.exports = router;
