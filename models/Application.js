const mongoose = require('mongoose');

const formAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
}, { _id: false });

const roundScheduleSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  roundName: { type: String, default: '' },
  scheduledAt: { type: Date },
  venue: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Form answers submitted by candidate
  formAnswers: {
    type: [formAnswerSchema],
    default: [],
  },
  // Application lifecycle status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'in_round', 'rejected', 'hired'],
    default: 'submitted',
  },
  // Which round the candidate is currently in (0 = not yet in any round)
  currentRound: {
    type: Number,
    default: 0,
  },
  // Schedule info for each round
  roundSchedules: {
    type: [roundScheduleSchema],
    default: [],
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  rejectedAt: {
    type: Date,
  },
  hiredAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Application', applicationSchema);
