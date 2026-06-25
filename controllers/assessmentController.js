const CandidateAssessment = require('../models/CandidateAssessment');
const QuestionBank = require('../models/QuestionBank');
const AssessmentResult = require('../models/AssessmentResult');
const ProctorReport = require('../models/ProctorReport');
const Application = require('../models/Application');

const getOrGenerateAssessment = async (req, res) => {
  try {
    const { jobId, roundNumber } = req.params;
    const candidateId = req.user.id;

    // Return existing generated assessment if already created
    let assessment = await CandidateAssessment.findOne({ candidateId, jobId, roundNumber }).populate('questions');
    if (assessment) {
      return res.status(200).json(assessment);
    }

    // Get candidate's application → find the roundSchedule entry
    const application = await Application.findOne({ jobId, applicantId: candidateId });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const roundSchedule = application.roundSchedules.find(
      (rs) => rs.roundNumber === parseInt(roundNumber)
    );

    if (!roundSchedule || roundSchedule.roundType !== 'assessment') {
      return res.status(400).json({ message: 'No online assessment has been configured for this round' });
    }

    // Support both new (assessmentConfig) and old (assessmentDetails) schema
    const cfg = roundSchedule.assessmentConfig || roundSchedule.assessmentDetails;
    if (!cfg) {
      return res.status(400).json({ message: 'Assessment configuration is missing' });
    }

    const assessmentType = cfg.assessmentType || cfg.type;
    const numQuestions   = cfg.numQuestions || 10;
    const difficulty     = cfg.difficulty || { easy: 40, medium: 40, hard: 20 };
    const duration       = cfg.duration || 45;
    const availableFrom  = cfg.availableFrom  || cfg.startTime;
    const availableUntil = cfg.availableUntil || cfg.endTime;

    // Validate availability window
    const now = new Date();
    if (availableFrom) {
      const start = new Date(availableFrom);
      if (now < start) {
        return res.status(400).json({
          message: `Assessment is not yet available. It opens at ${start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
        });
      }
    }
    if (availableUntil) {
      const end = new Date(availableUntil);
      if (now > end) {
        return res.status(400).json({ message: 'The assessment window has closed.' });
      }
    }

    // Map type → QuestionBank category
    let category = 'Aptitude';
    if (assessmentType === 'Technical MCQ') category = 'Technical';
    else if (assessmentType === 'Coding Round') category = 'Coding';

    const totalQ      = numQuestions;
    const easyCount   = Math.floor(((difficulty.easy   ?? 40) / 100) * totalQ);
    const hardCount   = Math.floor(((difficulty.hard   ?? 20) / 100) * totalQ);
    const mediumCount = totalQ - easyCount - hardCount;

    const [easyQs, mediumQs, hardQs] = await Promise.all([
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Easy'   } }, { $sample: { size: easyCount   } }]),
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Medium' } }, { $sample: { size: mediumCount } }]),
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Hard'   } }, { $sample: { size: hardCount   } }]),
    ]);

    let finalQuestions = [...easyQs, ...mediumQs, ...hardQs]
      .map(q => q._id)
      .sort(() => Math.random() - 0.5);

    assessment = await CandidateAssessment.create({
      candidateId,
      jobId,
      roundNumber,
      questions: finalQuestions,
      duration,
      startTime: Date.now(),
      status: 'Pending',
    });

    assessment = await assessment.populate('questions');
    res.status(201).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating assessment' });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { answers, proctorData } = req.body; // answers is a map of questionId -> selectedAnswer
    const candidateId = req.user.id;

    let assessment = await CandidateAssessment.findOne({ _id: assessmentId, candidateId }).populate('questions');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (assessment.status === 'Completed') return res.status(400).json({ message: 'Assessment already completed' });

    // Calculate time taken
    const timeTakenMs = Date.now() - new Date(assessment.startTime).getTime();
    const timeTakenMins = Math.round(timeTakenMs / 60000);

    // Evaluate
    let score = 0;
    const totalQuestions = assessment.questions.length;
    
    assessment.questions.forEach(q => {
      if (q.type === 'MCQ') {
        if (answers[q._id] === q.correctAnswer) score += 1;
      } else {
        // Coding auto-evaluation simplified for now: 1 point if answered at all (usually requires code execution)
        if (answers[q._id] && answers[q._id].trim().length > 10) score += 1; 
      }
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 50; // simple threshold

    // Create Result
    const result = await AssessmentResult.create({
      candidateId,
      assessmentId,
      score,
      percentage,
      timeTaken: timeTakenMins,
      status: passed ? 'Passed' : 'Failed'
    });

    // Create Proctor Report
    let trustScore = 100;
    trustScore -= (proctorData.tabSwitchCount || 0) * 10;
    trustScore -= (proctorData.fullscreenExitCount || 0) * 10;
    trustScore -= (proctorData.copyPasteAttempts || 0) * 5;
    if (trustScore < 0) trustScore = 0;

    await ProctorReport.create({
      candidateId,
      assessmentId,
      tabSwitchCount: proctorData.tabSwitchCount || 0,
      fullscreenExitCount: proctorData.fullscreenExitCount || 0,
      copyPasteAttempts: proctorData.copyPasteAttempts || 0,
      violations: proctorData.violations || [],
      trustScore
    });

    // Mark as completed
    assessment.status = 'Completed';
    await assessment.save();

    res.status(200).json({ message: 'Submitted successfully', result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting assessment' });
  }
};

const getAssessmentReport = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const result = await AssessmentResult.findOne({ assessmentId });
    const proctor = await ProctorReport.findOne({ assessmentId });
    res.status(200).json({ result, proctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching report' });
  }
};

const getAssessmentById = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const candidateId = req.user.id;
    const assessment = await CandidateAssessment.findOne({ _id: assessmentId, candidateId }).populate('questions');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    res.status(200).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching assessment' });
  }
};

const getJobAssessmentResults = async (req, res) => {
  try {
    const { jobId } = req.params;
    const assessments = await CandidateAssessment.find({ jobId, status: 'Completed' });
    const assessmentIds = assessments.map(a => a._id);
    
    const results = await AssessmentResult.find({ assessmentId: { $in: assessmentIds } }).populate('candidateId', 'name profileImage email');
    const proctors = await ProctorReport.find({ assessmentId: { $in: assessmentIds } });

    const leaderboard = results.map(r => {
      const proctor = proctors.find(p => p.assessmentId.toString() === r.assessmentId.toString());
      return {
        ...r.toObject(),
        proctorReport: proctor || null
      };
    }).sort((a, b) => b.score - a.score); // Highest score first

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};

module.exports = {
  getOrGenerateAssessment,
  submitAssessment,
  getAssessmentReport,
  getAssessmentById,
  getJobAssessmentResults
};
