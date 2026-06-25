const mongoose = require('mongoose');

const formAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
}, { _id: false });

const roundScheduleSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  roundName:   { type: String, default: '' },
  // 'assessment' = fully online inside HireVerse
  // 'interview'  = live meeting (Zoom/Google Meet/in-person)
  roundType: { type: String, enum: ['assessment', 'interview'], default: 'interview' },

  // ── Only populated when roundType === 'assessment' ───────────────────────
  assessmentConfig: {
    assessmentType: { type: String, enum: ['Aptitude MCQ', 'Technical MCQ', 'Coding Round'] },
    numQuestions:   { type: Number, default: 20 },
    difficulty: {
      easy:   { type: Number, default: 40 },
      medium: { type: Number, default: 40 },
      hard:   { type: Number, default: 20 },
    },
    duration:       { type: Number, default: 45 },  // minutes
    availableFrom:  { type: String },               // ISO datetime string
    availableUntil: { type: String },               // ISO datetime string
  },

  // ── Only populated when roundType === 'interview' ────────────────────────
  interviewConfig: {
    scheduledAt:  { type: Date },
    meetingLink:  { type: String, default: '' },
    notes:        { type: String, default: '' },
  },
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
  formAnswers: {
    type: [formAnswerSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'in_round', 'rejected', 'hired'],
    default: 'submitted',
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  roundSchedules: {
    type: [roundScheduleSchema],
    default: [],
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  rejectedAt: { type: Date },
  hiredAt:    { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Application', applicationSchema);
