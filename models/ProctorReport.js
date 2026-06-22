const mongoose = require('mongoose');

const proctorReportSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CandidateAssessment',
    required: true,
  },
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  fullscreenExitCount: {
    type: Number,
    default: 0,
  },
  copyPasteAttempts: {
    type: Number,
    default: 0,
  },
  violations: [{
    type: String,
  }],
  trustScore: {
    type: Number,
    default: 100,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProctorReport', proctorReportSchema);
