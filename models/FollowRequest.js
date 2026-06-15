const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Ensure a single pending follow request exists between any two users to avoid duplicates
followRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('FollowRequest', followRequestSchema);
