const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  likePost,
  commentOnPost,
  getUserPosts,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createPost)
  .get(protect, getAllPosts);

router.get('/user/:userId', protect, getUserPosts);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentOnPost);

module.exports = router;
