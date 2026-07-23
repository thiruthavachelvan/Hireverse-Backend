const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String },
}, { _id: false });

const questionBankSchema = new mongoose.Schema({
  questionId: {
    type: String,
    unique: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      'Aptitude',
      'Technical',
      'Coding',
      'Debugging',
      'Frontend',
      'Backend',
      'Database',
      'System Design',
      'Product Thinking',
      'Founder Challenge',
      'UI/UX Design',
      'QA Testing',
      'AI / Machine Learning',
      'Cybersecurity',
      'DevOps',
      'Culture Fit',
      'Behavioral',
      'Startup Scenarios',
      'Assignment',
    ],
    required: true,
    index: true,
  },
  subCategory: {
    type: String,
    default: 'General',
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'MCQ',
      'Coding',
      'Debugging',
      'Frontend',
      'Backend',
      'Database',
      'SystemDesign',
      'ProductThinking',
      'FounderChallenge',
      'UIDesign',
      'QATesting',
      'AIML',
      'Cybersecurity',
      'DevOps',
      'CultureFit',
      'Behavioral',
      'Assignment',
    ],
    required: true,
  },
  
  // Text & Problem Statement
  question: { type: String, required: true },
  description: { type: String },

  // MCQ specific
  options: [{ type: String }],
  correctAnswer: { type: String },
  isMultipleCorrect: { type: Boolean, default: false },
  
  // Coding & Debugging specific
  problemTitle: { type: String },
  starterCode: {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' },
    go: { type: String, default: '' },
  },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  testCases: [testCaseSchema],

  // Design, System Architecture & Founder Challenges
  initialNodes: [{ type: mongoose.Schema.Types.Mixed }],
  initialEdges: [{ type: mongoose.Schema.Types.Mixed }],
  deliverables: [{ type: String }],
  rubric: [{ criterion: String, weight: Number }],

  // Explanations, Metadata & Analytics
  explanation: { type: String },
  expectedTime: { type: Number, default: 15 }, // minutes
  marks: { type: Number, default: 10 },
  tags: [{ type: String }],
  technology: { type: String, index: true },
  hints: [{ type: String }],
  referenceLinks: [{ type: String }],
  usageCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Auto-generate questionId if missing
questionBankSchema.pre('save', function (next) {
  if (!this.questionId) {
    const catPrefix = (this.category || 'QB').substring(0, 3).toUpperCase();
    const diffPrefix = (this.difficulty || 'EZ').substring(0, 1).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.questionId = `${catPrefix}-${diffPrefix}-${Date.now().toString().slice(-4)}${rand}`;
  }
  next();
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
