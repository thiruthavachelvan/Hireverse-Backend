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

module.exports = router;
