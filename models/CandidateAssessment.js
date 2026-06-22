const mongoose = require('mongoose');

const candidateAssessmentSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  roundNumber: {
    type: Number,
    required: true,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
  }],
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  startTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CandidateAssessment', candidateAssessmentSchema);
