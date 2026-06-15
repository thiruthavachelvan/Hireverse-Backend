const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FollowRequest = require('../models/FollowRequest');
const Notification = require('../models/Notification');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyhireverse123', {
    expiresIn: '30d',
  });
};

// Helper to build user response object
const buildUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  accountType: user.accountType,
  profileImage: user.profileImage,
  headline: user.headline,
  bio: user.bio,
  skills: user.skills,
  followers: user.followers,
  following: user.following,
  verificationStatus: user.verificationStatus,
  companyDetails: user.companyDetails,
  employmentStatus: user.employmentStatus,
  workExperience: user.workExperience,
  education: user.education,
  resume: user.resume,
  ...(token && { token }),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, accountType, companyDetails, employmentStatus, workExperience, education } = req.body;

    if (!name || !email || !password || !accountType) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Prevent self-registration as admin
    if (accountType === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be self-registered' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      accountType,
      profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    };

    // Add professional details if professional
    if (accountType === 'professional') {
      userData.employmentStatus = employmentStatus || 'unemployed';
      userData.workExperience = workExperience || [];
      userData.education = education || {};
    }

    // Add company details if registering as a company
    if (accountType === 'company' && companyDetails) {
      userData.companyDetails = companyDetails;
      userData.verificationStatus = 'pending';
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json(buildUserResponse(user, generateToken(user._id)));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile by ID or logged in profile
// @route   GET /api/auth/profile/:id
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'name headline profileImage email')
      .populate('following', 'name headline profileImage email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.headline = req.body.headline !== undefined ? req.body.headline : user.headline;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.skills = req.body.skills !== undefined ? req.body.skills : user.skills;
    if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }
    if (req.body.companyDetails && user.accountType === 'company') {
      user.companyDetails = { ...user.companyDetails, ...req.body.companyDetails };
    }
    if (user.accountType === 'professional') {
      user.employmentStatus = req.body.employmentStatus !== undefined ? req.body.employmentStatus : user.employmentStatus;
      user.workExperience = req.body.workExperience !== undefined ? req.body.workExperience : user.workExperience;
      user.education = req.body.education !== undefined ? req.body.education : user.education;
      if (req.body.resume !== undefined) {
        user.resume = req.body.resume;
      }
    }

    const updatedUser = await user.save();
    res.json(buildUserResponse(updatedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Follow a user
// @route   POST /api/auth/follow/:id
// @access  Private
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If both are professionals, treat follow as a connection request
    if (targetUser.accountType === 'professional' && currentUser.accountType === 'professional') {
      if (currentUser.following.includes(targetUserId)) {
        return res.status(400).json({ message: 'Already connected with this user' });
      }

      // Check if there is already a pending connection request
      const existingRequest = await FollowRequest.findOne({
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'pending',
      });

      if (existingRequest) {
        return res.status(400).json({ message: 'Connection request already sent and pending' });
      }

      // Create a pending connection request
      await FollowRequest.create({
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'pending',
      });

      // Notify the receiver
      await Notification.create({
        recipientId: targetUserId,
        type: 'follow_request',
        title: 'New Connection Request',
        message: `${currentUser.name} wants to connect with you.`,
      });

      return res.json({ message: 'Connection request sent successfully', requestPending: true });
    }

    // Otherwise, follow immediately (e.g. professional following a company)
    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Successfully followed user', following: currentUser.following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow a user
// @route   POST /api/auth/unfollow/:id
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mutual disconnection for professionals
    if (currentUser.accountType === 'professional' && targetUser.accountType === 'professional') {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      currentUser.followers = currentUser.followers.filter(id => id.toString() !== targetUserId);
      targetUser.following = targetUser.following.filter(id => id.toString() !== currentUserId.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());

      // Delete the follow request
      await FollowRequest.deleteMany({
        $or: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      });
    } else {
      // Standard unfollow (e.g. unfollowing a company)
      if (!currentUser.following.includes(targetUserId)) {
        return res.status(400).json({ message: 'You are not following this user' });
      }
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Successfully disconnected/unfollowed', following: currentUser.following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending follow/connection requests
// @route   GET /api/auth/follow-requests
// @access  Private
const getFollowRequests = async (req, res) => {
  try {
    const requests = await FollowRequest.find({
      receiverId: req.user._id,
      status: 'pending',
    }).populate('senderId', 'name email headline profileImage');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept follow/connection request
// @route   PUT /api/auth/follow-request/:id/accept
// @access  Private
const acceptFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await FollowRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'accepted';
    await request.save();

    const sender = await User.findById(request.senderId);
    const receiver = await User.findById(request.receiverId);

    if (sender && receiver) {
      // Add to both follow lists for mutual connection
      if (!sender.following.includes(receiver._id)) sender.following.push(receiver._id);
      if (!receiver.followers.includes(sender._id)) receiver.followers.push(sender._id);
      if (!receiver.following.includes(sender._id)) receiver.following.push(sender._id);
      if (!sender.followers.includes(receiver._id)) sender.followers.push(receiver._id);

      await sender.save();
      await receiver.save();

      // Create notification for sender
      await Notification.create({
        recipientId: sender._id,
        type: 'follow_accepted',
        title: 'Connection Request Accepted',
        message: `${receiver.name} accepted your connection request. You are now connected!`,
      });
    }

    res.json({ message: 'Connection request accepted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject follow/connection request
// @route   PUT /api/auth/follow-request/:id/reject
// @access  Private
const rejectFollowRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await FollowRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Connection request rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users for search/recommendations
// @route   GET /api/auth/users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email headline profileImage accountType followers verificationStatus companyDetails');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
