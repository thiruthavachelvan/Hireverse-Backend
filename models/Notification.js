const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'application_received',   // company gets this
      'application_accepted',   // candidate gets this (accepted into Round 1)
      'application_rejected',   // candidate gets this
      'round_scheduled',        // candidate gets this (date/time set)
      'round_advanced',         // candidate gets this (moved to next round)
      'hired',                  // candidate gets this (final hire)
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  relatedApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  roundNumber: {
    type: Number,
  },
  scheduledAt: {
    type: Date,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
