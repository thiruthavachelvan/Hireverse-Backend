const CandidateAssessment = require('../models/CandidateAssessment');
const QuestionBank = require('../models/QuestionBank');
const AssessmentResult = require('../models/AssessmentResult');
const ProctorReport = require('../models/ProctorReport');
const Job = require('../models/Job');

const getOrGenerateAssessment = async (req, res) => {
  try {
    const { jobId, roundNumber } = req.params;
    const candidateId = req.user.id;

    // Check if assessment already generated
    let assessment = await CandidateAssessment.findOne({ candidateId, jobId, roundNumber }).populate('questions');
    if (assessment) {
      // If it is already completed, you might not want to return questions, but for now we do.
      return res.status(200).json(assessment);
    }

    // Get the job and round details
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const round = job.rounds.find((r) => r.roundNumber === parseInt(roundNumber));
    if (!round || !round.hasAssessment || !round.assessmentDetails) {
      return res.status(400).json({ message: 'Assessment not found for this round' });
    }

    const { type, numQuestions, difficulty, duration } = round.assessmentDetails;

    // Based on type, decide category
    let category;
    if (type === 'Aptitude MCQ') category = 'Aptitude';
    else if (type === 'Technical MCQ') category = 'Technical';
    else if (type === 'Coding Round') category = 'Coding';

    const easyCount = Math.floor((difficulty.easy / 100) * numQuestions);
    const hardCount = Math.floor((difficulty.hard / 100) * numQuestions);
    const mediumCount = numQuestions - easyCount - hardCount;

    // Aggregate sample questions
    const [easyQs, mediumQs, hardQs] = await Promise.all([
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Easy' } }, { $sample: { size: easyCount } }]),
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Medium' } }, { $sample: { size: mediumCount } }]),
      QuestionBank.aggregate([{ $match: { category, difficulty: 'Hard' } }, { $sample: { size: hardCount } }]),
    ]);

    let finalQuestions = [...easyQs, ...mediumQs, ...hardQs].map(q => q._id);
    
    // Shuffle the final questions
    finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);

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
