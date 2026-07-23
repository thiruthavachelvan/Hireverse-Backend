const QuestionBank = require('../models/QuestionBank');

// @desc    Get questions with pagination & filtering
// @route   GET /api/question-bank
// @access  Private (Admin / Company / Candidate)
const getQuestions = async (req, res) => {
  try {
    const {
      search,
      category,
      subCategory,
      difficulty,
      technology,
      type,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (difficulty) query.difficulty = difficulty;
    if (technology) query.technology = technology;
    if (type) query.type = type;

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { questionId: { $regex: search, $options: 'i' } },
        { technology: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Hide answers if not admin/company preview
    const isAdminOrCompany = req.user?.accountType === 'admin' || req.user?.accountType === 'company';
    const selectFields = isAdminOrCompany ? '' : '-correctAnswer -explanation -testCases.output';

    const [questions, total] = await Promise.all([
      QuestionBank.find(query)
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      QuestionBank.countDocuments(query),
    ]);

    res.json({
      questions,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error retrieving questions' });
  }
};

// @desc    Get single question by ID
// @route   GET /api/question-bank/:id
// @access  Private
const getQuestionById = async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isAdminOrCompany = req.user?.accountType === 'admin' || req.user?.accountType === 'company';
    if (!isAdminOrCompany) {
      // Hide correct answer from candidate view
      const safe = question.toObject();
      delete safe.correctAnswer;
      delete safe.explanation;
      if (safe.testCases) {
        safe.testCases = safe.testCases.map(tc => tc.isHidden ? { input: tc.input, isHidden: true } : tc);
      }
      return res.json(safe);
    }

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error retrieving question' });
  }
};

// @desc    Create new question
// @route   POST /api/question-bank
// @access  Admin only
const createQuestion = async (req, res) => {
  try {
    const questionData = req.body;
    const newQuestion = await QuestionBank.create(questionData);
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(400).json({ message: error.message || 'Failed to create question' });
  }
};

// @desc    Update question
// @route   PUT /api/question-bank/:id
// @access  Admin only
const updateQuestion = async (req, res) => {
  try {
    const updated = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(400).json({ message: error.message || 'Failed to update question' });
  }
};

// @desc    Delete question
// @route   DELETE /api/question-bank/:id
// @access  Admin only
const deleteQuestion = async (req, res) => {
  try {
    const deleted = await QuestionBank.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// @desc    Batch import questions from JSON
// @route   POST /api/question-bank/import
// @access  Admin only
const importQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide a non-empty array of questions' });
    }

    const inserted = await QuestionBank.insertMany(questions, { ordered: false });
    res.status(201).json({
      message: `Successfully imported ${inserted.length} questions`,
      count: inserted.length,
    });
  } catch (error) {
    console.error('Batch import error:', error);
    res.status(400).json({ message: error.message || 'Failed to import batch questions' });
  }
};

// @desc    Get analytics for Question Bank
// @route   GET /api/question-bank/analytics
// @access  Admin / Company
const getAnalytics = async (req, res) => {
  try {
    const [
      totalQuestions,
      categoryStats,
      difficultyStats,
      techStats,
      mostUsed
    ] = await Promise.all([
      QuestionBank.countDocuments(),
      QuestionBank.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      QuestionBank.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      QuestionBank.aggregate([
        { $match: { technology: { $exists: true, $ne: null } } },
        { $group: { _id: '$technology', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      QuestionBank.find().sort({ usageCount: -1 }).limit(5).select('question category difficulty usageCount questionId')
    ]);

    res.json({
      totalQuestions,
      byCategory: categoryStats.map(item => ({ category: item._id, count: item.count })),
      byDifficulty: difficultyStats.map(item => ({ difficulty: item._id, count: item.count })),
      topTechnologies: techStats.map(item => ({ technology: item._id, count: item.count })),
      mostUsedQuestions: mostUsed,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to generate question bank analytics' });
  }
};

// @desc    Random assessment generator for companies
// @route   POST /api/question-bank/generate
// @access  Company / Admin
const generateAssessment = async (req, res) => {
  try {
    const {
      categories = ['Aptitude', 'Technical'],
      difficultyDistribution = { Easy: 40, Medium: 40, Hard: 20, Expert: 0 },
      count = 10,
      technologies = [],
    } = req.body;

    const totalQ = parseInt(count) || 10;

    // Calculate count per difficulty
    const easyCount = Math.round(((difficultyDistribution.Easy || 40) / 100) * totalQ);
    const mediumCount = Math.round(((difficultyDistribution.Medium || 40) / 100) * totalQ);
    const hardCount = Math.round(((difficultyDistribution.Hard || 20) / 100) * totalQ);
    const expertCount = Math.max(0, totalQ - easyCount - mediumCount - hardCount);

    const baseMatch = { category: { $in: categories } };
    if (technologies.length > 0) {
      baseMatch.technology = { $in: technologies };
    }

    const [easyQs, mediumQs, hardQs, expertQs] = await Promise.all([
      easyCount > 0 ? QuestionBank.aggregate([{ $match: { ...baseMatch, difficulty: 'Easy' } }, { $sample: { size: easyCount } }]) : [],
      mediumCount > 0 ? QuestionBank.aggregate([{ $match: { ...baseMatch, difficulty: 'Medium' } }, { $sample: { size: mediumCount } }]) : [],
      hardCount > 0 ? QuestionBank.aggregate([{ $match: { ...baseMatch, difficulty: 'Hard' } }, { $sample: { size: hardCount } }]) : [],
      expertCount > 0 ? QuestionBank.aggregate([{ $match: { ...baseMatch, difficulty: 'Expert' } }, { $sample: { size: expertCount } }]) : [],
    ]);

    let finalQuestions = [...easyQs, ...mediumQs, ...hardQs, ...expertQs];

    // Fallback if not enough matching difficulty questions
    if (finalQuestions.length < totalQ) {
      const existingIds = finalQuestions.map(q => q._id);
      const remainingNeeded = totalQ - finalQuestions.length;
      const fillQs = await QuestionBank.aggregate([
        { $match: { ...baseMatch, _id: { $nin: existingIds } } },
        { $sample: { size: remainingNeeded } }
      ]);
      finalQuestions = [...finalQuestions, ...fillQs];
    }

    // Increment usage counts asynchronously
    const ids = finalQuestions.map(q => q._id);
    QuestionBank.updateMany({ _id: { $in: ids } }, { $inc: { usageCount: 1 } }).exec().catch(() => {});

    res.json({
      count: finalQuestions.length,
      questions: finalQuestions,
    });
  } catch (error) {
    console.error('Assessment generation error:', error);
    res.status(500).json({ message: 'Failed to generate assessment' });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  getAnalytics,
  generateAssessment,
};
