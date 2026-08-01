const CandidateAssessment = require('../models/CandidateAssessment');
const QuestionBank = require('../models/QuestionBank');
const AssessmentResult = require('../models/AssessmentResult');
const ProctorReport = require('../models/ProctorReport');
const Application = require('../models/Application');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Job = require('../models/Job');

const getOrGenerateAssessment = async (req, res) => {
  try {
    const { jobId, roundNumber } = req.params;
    const candidateId = req.user.id;

    // Return existing generated assessment if already created
    let assessment = await CandidateAssessment.findOne({ candidateId, jobId, roundNumber }).populate('questions');
    if (assessment) {
      const asmObj = assessment.toObject();
      const application = await Application.findOne({ jobId, applicantId: candidateId });
      const rs = application?.roundSchedules?.find(r => r.roundNumber === parseInt(roundNumber));
      asmObj.roundType = rs?.assessmentConfig?.assessmentType || rs?.roundName || 'aptitude';
      const job = await Job.findById(jobId);
      if (job) asmObj.jobTitle = job.jobTitle;
      return res.status(200).json(asmObj);
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

    // Map assessmentType → QuestionBank category
    const categoryMap = {
      'Aptitude MCQ':     'Aptitude',
      'Technical MCQ':    'Technical',
      'Coding Round':     'Coding',
      'Debugging':        'Debugging',
      'Frontend':         'Frontend',
      'Backend':          'Backend',
      'Database Design':  'Database Design',
      'System Design':    'System Design',
      'Product Thinking': 'Product Thinking',
      'Founder Challenge':'Founder Challenge',
      'UI/UX Design':     'UI/UX Design',
      'QA Testing':       'QA Testing',
      'AI/ML':            'AI/ML',
      'Cybersecurity':    'Cybersecurity',
      'DevOps':           'DevOps',
      'Culture Fit':      'Culture Fit',
      'Behavioral':       'Behavioral',
      'HR Interview':     'Culture Fit',   // HR maps to Culture Fit bucket
      'Resume Screening': 'Aptitude',       // Resume Screening → Aptitude fallback
      'Assignment':       'Coding',         // Assignment → Coding bucket
      'Case Study':       'Product Thinking', // Case Study → Product Thinking
    };
    let category = categoryMap[assessmentType] || 'Aptitude';


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
    const asmObj = assessment.toObject();
    asmObj.roundType = assessmentType;
    const job = await Job.findById(jobId);
    if (job) asmObj.jobTitle = job.jobTitle;
    res.status(201).json(asmObj);
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
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const totalQuestions = assessment.questions.length;
    
    assessment.questions.forEach(q => {
      const candidateAns = answers[q._id];
      if (q.type === 'MCQ') {
        if (candidateAns === q.correctAnswer) {
          correctAnswers += 1;
        } else {
          wrongAnswers += 1;
        }
      } else {
        // Coding auto-evaluation simplified for now: 1 point if answered at all (usually requires code execution)
        if (candidateAns && candidateAns.trim().length > 10) {
          correctAnswers += 1;
        } else {
          wrongAnswers += 1;
        }
      }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 50; // simple threshold

    // Calculate proctoring trust score in backend
    let trustScore = 100;
    trustScore -= (proctorData.tabSwitchCount || 0) * 10;
    trustScore -= (proctorData.fullscreenExitCount || 0) * 10;
    trustScore -= (proctorData.copyPasteAttempts || 0) * 5;
    trustScore -= (proctorData.rightClickAttempts || 0) * 5;
    if (trustScore < 0) trustScore = 0;

    // 1. Create Proctor Report
    const proctorReport = await ProctorReport.create({
      candidateId,
      assessmentId,
      tabSwitchCount: proctorData.tabSwitchCount || 0,
      fullscreenExitCount: proctorData.fullscreenExitCount || 0,
      copyPasteAttempts: proctorData.copyPasteAttempts || 0,
      rightClickAttempts: proctorData.rightClickAttempts || 0,
      totalTimeOutsideSecureMode: proctorData.totalTimeOutsideSecureMode || 0,
      violations: proctorData.violations || [],
      trustScore
    });

    // 2. Query Job to get companyId
    const job = await Job.findById(assessment.jobId);
    const companyId = job?.companyId || candidateId; // Fallback if job not found

    // 3. Create Assessment Attempt
    const attempt = await AssessmentAttempt.create({
      candidateId,
      assessmentId,
      jobId: assessment.jobId,
      companyId,
      answers,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score: correctAnswers,
      percentage,
      timeTaken: timeTakenMins,
      submittedAt: new Date(),
      status: 'Completed',
      proctorReportId: proctorReport._id
    });

    // Link attemptId back to Proctor Report
    proctorReport.attemptId = attempt._id;
    await proctorReport.save();

    // 4. Create Result (backward compatibility)
    await AssessmentResult.create({
      candidateId,
      assessmentId,
      score: correctAnswers,
      percentage,
      timeTaken: timeTakenMins,
      status: passed ? 'Passed' : 'Failed'
    });

    // 5. Update Application currentRound.status and roundSchedules status
    const application = await Application.findOne({ jobId: assessment.jobId, applicantId: candidateId });
    if (application) {
      application.currentRoundStatus = 'Completed';
      application.assessmentCompleted = true;
      application.attemptId = attempt._id;
      
      const rsIndex = application.roundSchedules.findIndex(rs => rs.roundNumber === assessment.roundNumber);
      if (rsIndex !== -1) {
        application.roundSchedules[rsIndex].status = 'Completed';
        application.roundSchedules[rsIndex].assessmentCompleted = true;
        application.roundSchedules[rsIndex].attemptId = attempt._id;
      }
      await application.save();
    }

    // Mark CandidateAssessment as completed
    assessment.status = 'Completed';
    await assessment.save();

    // Response does not return trust score or violations to the candidate
    res.status(200).json({ message: 'Submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting assessment' });
  }
};

const getAssessmentReport = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    let attempt = await AssessmentAttempt.findOne({ assessmentId })
      .populate('candidateId', 'name profileImage email headline')
      .populate('assessmentId');
    const proctor = await ProctorReport.findOne({ assessmentId });

    if (!attempt) {
      // Fallback backwards compatibility
      const result = await AssessmentResult.findOne({ assessmentId }).populate('candidateId', 'name profileImage email headline');
      if (result) {
        const assessment = await CandidateAssessment.findById(assessmentId);
        attempt = {
          candidateId: result.candidateId,
          assessmentId: result.assessmentId,
          totalQuestions: assessment?.questions?.length || 10,
          correctAnswers: result.score,
          wrongAnswers: Math.max(0, (assessment?.questions?.length || 10) - result.score),
          score: result.score,
          percentage: result.percentage,
          timeTaken: result.timeTaken,
          status: 'Completed',
          submittedAt: result.createdAt
        };
      }
    }
    res.status(200).json({ attempt, proctor });
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

    const asmObj = assessment.toObject();
    const application = await Application.findOne({ jobId: assessment.jobId, applicantId: candidateId });
    if (application) {
      const rs = application.roundSchedules?.find(r => r.roundNumber === assessment.roundNumber);
      if (rs) {
        asmObj.roundType = rs.assessmentConfig?.assessmentType || rs.roundName || 'aptitude';
      }
    }
    const job = await Job.findById(assessment.jobId);
    if (job) asmObj.jobTitle = job.jobTitle;

    res.status(200).json(asmObj);
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
    }).sort((a, b) => {
      // 1. Highest score percentage
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      // 2. Highest trust score
      const trustA = a.proctorReport?.trustScore ?? 100;
      const trustB = b.proctorReport?.trustScore ?? 100;
      if (trustB !== trustA) {
        return trustB - trustA;
      }
      // 3. Lowest completion time
      return a.timeTaken - b.timeTaken;
    });

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
