const Post = require('../models/Post');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.create({
      userId: req.user._id,
      content,
      image: image || '',
      likes: [],
      comments: [],
    });

    const populatedPost = await Post.findById(post._id).populate(
      'userId',
      'name headline profileImage accountType'
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts for social feed
// @route   GET /api/posts
// @access  Private
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'name headline profileImage accountType')
      .populate('comments.userId', 'name headline profileImage')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like or unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked
    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      // Unlike post
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // Like post
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({ likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      userId: req.user._id,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('userId', 'name headline profileImage accountType')
      .populate('comments.userId', 'name headline profileImage');

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  likePost,
  commentOnPost,
};
