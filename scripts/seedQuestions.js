require('dotenv').config();
const mongoose = require('mongoose');
const QuestionBank = require('../models/QuestionBank');
const connectDB = require('../config/db');

const seedQuestions = async () => {
  await connectDB();

  await QuestionBank.deleteMany({});
  console.log('Existing questions cleared.');

  const questions = [];

  // Generate 30 Aptitude Questions
  const aptitudeTopics = ['Numbers', 'Logical Reasoning', 'Time and Work', 'Percentages'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
  for (let i = 1; i <= 30; i++) {
    questions.push({
      category: 'Aptitude',
      topic: aptitudeTopics[i % aptitudeTopics.length],
      difficulty: difficulties[i % difficulties.length],
      type: 'MCQ',
      question: `Sample Aptitude Question ${i}: What is the value of ${i} + ${i * 2}?`,
      options: [`${i}`, `${i * 3}`, `${i * 2}`, `${i * 4}`],
      correctAnswer: `${i * 3}`,
      explanation: `The sum of ${i} and ${i * 2} is ${i * 3}.`,
    });
  }

  // Generate 30 Technical Questions
  const technicalTopics = ['React', 'JavaScript', 'Node', 'MongoDB'];
  for (let i = 1; i <= 30; i++) {
    questions.push({
      category: 'Technical',
      topic: technicalTopics[i % technicalTopics.length],
      difficulty: difficulties[i % difficulties.length],
      type: 'MCQ',
      question: `Sample Technical Question ${i} on ${technicalTopics[i % technicalTopics.length]}. What is correct?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Option A is generally the correct answer for this generated question.',
    });
  }

  // Generate 10 Coding Questions
  for (let i = 1; i <= 10; i++) {
    questions.push({
      category: 'Coding',
      topic: 'Algorithms',
      difficulty: difficulties[i % difficulties.length],
      type: 'Coding',
      problemTitle: `Sample Coding Problem ${i}`,
      description: `Write a function that returns the square of a number. (Problem ${i})`,
      sampleInput: `2`,
      sampleOutput: `4`,
      testCases: [
        { input: `2`, output: `4` },
        { input: `3`, output: `9` },
      ],
    });
  }

  try {
    await QuestionBank.insertMany(questions);
    console.log(`Successfully seeded ${questions.length} questions!`);
    process.exit();
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
};

seedQuestions();
