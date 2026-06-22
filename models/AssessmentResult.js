const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['Passed', 'Failed'],
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);
