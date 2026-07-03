const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
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
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: {
    type: mongoose.Schema.Types.Map,
    of: String,
    default: {},
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  wrongAnswers: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number, // in minutes
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Completed'],
    default: 'Completed',
  },
  proctorReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProctorReport',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
