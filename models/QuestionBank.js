const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
}, { _id: false });

const questionBankSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Aptitude', 'Technical', 'Coding'],
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  type: {
    type: String,
    enum: ['MCQ', 'Coding'],
    required: true,
  },
  
  // MCQ specific fields
  question: { type: String },
  options: [{ type: String }],
  correctAnswer: { type: String },
  explanation: { type: String },
  
  // Coding specific fields
  problemTitle: { type: String },
  description: { type: String },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  testCases: [testCaseSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
