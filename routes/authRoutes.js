const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getAllUsers,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, getAllUsers);
router.get('/profile', protect, getUserProfile); // Get logged-in user
router.get('/profile/:id', protect, getUserProfile); // Get specific user
router.put('/profile', protect, updateUserProfile);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);
router.get('/follow-requests', protect, getFollowRequests);
router.put('/follow-request/:id/accept', protect, acceptFollowRequest);
router.put('/follow-request/:id/reject', protect, rejectFollowRequest);

module.exports = router;
