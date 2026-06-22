const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  hasAssessment: { type: Boolean, default: false },
  assessmentDetails: {
    type: { type: String, enum: ['Aptitude MCQ', 'Technical MCQ', 'Coding Round'] },
    numQuestions: { type: Number },
    difficulty: {
      easy: { type: Number, default: 40 },
      medium: { type: Number, default: 40 },
      hard: { type: Number, default: 20 },
    },
    duration: { type: Number }, // in minutes
    startTime: { type: String }, // e.g., '10:00'
    endTime: { type: String }, // e.g., '15:00'
  }
}, { _id: false });

const formQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  required: { type: Boolean, default: true },
}, { _id: false });

const jobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  salary: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
    default: 'Full-time',
  },
  // Hiring rounds defined by company
  rounds: {
    type: [roundSchema],
    default: [],
  },
  // Custom application form questions
  applicationForm: {
    type: [formQuestionSchema],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Job', jobSchema);
