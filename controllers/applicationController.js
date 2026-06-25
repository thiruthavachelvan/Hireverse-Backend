const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');

// Helper to create a notification
const createNotification = async (data) => {
  try {
    await Notification.create(data);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// @desc    Apply for a job (with form answers)
// @route   POST /api/applications
// @access  Private (Professional only)
const createApplication = async (req, res) => {
  try {
    const { jobId, formAnswers } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId).populate('companyId', 'name');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.isActive) {
      return res.status(400).json({ message: 'This job listing is no longer active' });
    }

    // Check for duplicate application
    const alreadyApplied = await Application.findOne({
      jobId,
      applicantId: req.user._id,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Validate required form questions
    const requiredQuestions = job.applicationForm.filter(q => q.required);
    const answersMap = {};
    if (formAnswers && Array.isArray(formAnswers)) {
      formAnswers.forEach(fa => { answersMap[fa.question] = fa.answer; });
    }
    for (const rq of requiredQuestions) {
      if (!answersMap[rq.question] || !answersMap[rq.question].trim()) {
        return res.status(400).json({ message: `Required question not answered: "${rq.question}"` });
      }
    }

    // Build form answers from job's applicationForm to preserve question order
    const structuredAnswers = job.applicationForm.map(q => ({
      question: q.question,
      answer: answersMap[q.question] || '',
    }));

    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      formAnswers: structuredAnswers,
      status: 'submitted',
      currentRound: 0,
    });

    // Add applicant to job
    job.applicants.push(req.user._id);
    await job.save();

    // Notify the company
    await createNotification({
      recipientId: job.companyId._id,
      type: 'application_received',
      title: 'New Application Received',
      message: `${req.user.name} applied for "${job.jobTitle}"`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept application (move to under_review → in_round, currentRound = 1)
// @route   PUT /api/applications/:id/accept
// @access  Private (Company only)
const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } })
      .populate('applicantId', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = 'in_round';
    application.currentRound = 1;
    await application.save();

    const job = application.jobId;
    const round1 = job.rounds.find(r => r.roundNumber === 1);
    const roundName = round1 ? round1.name : 'Round 1';

    await createNotification({
      recipientId: application.applicantId._id,
      type: 'application_accepted',
      title: '🎉 Application Accepted!',
      message: `Your application for "${job.jobTitle}" at ${job.companyId.name} has been accepted. You are now in ${roundName}. Await schedule details.`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
      roundNumber: 1,
    });

    res.json({ message: 'Application accepted, candidate moved to Round 1', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject application
// @route   PUT /api/applications/:id/reject
// @access  Private (Company only)
const rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } })
      .populate('applicantId', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = 'rejected';
    application.rejectedAt = new Date();
    await application.save();

    const job = application.jobId;
    await createNotification({
      recipientId: application.applicantId._id,
      type: 'application_rejected',
      title: 'Application Update',
      message: `Thank you for applying to "${job.jobTitle}" at ${job.companyId.name}. Unfortunately, your application was not selected at this time.`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
    });

    res.json({ message: 'Application rejected', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Schedule a round (assessment OR interview)
// @route   PUT /api/applications/:id/schedule-round
// @access  Private (Company only)
const scheduleRound = async (req, res) => {
  try {
    const { roundNumber, roundType, assessmentConfig, interviewConfig } = req.body;

    if (!roundNumber) {
      return res.status(400).json({ message: 'Round number is required' });
    }
    if (roundType === 'interview' && !interviewConfig?.scheduledAt) {
      return res.status(400).json({ message: 'Interview date and time is required' });
    }
    if (roundType === 'assessment' && (!assessmentConfig?.availableFrom || !assessmentConfig?.availableUntil)) {
      return res.status(400).json({ message: 'Assessment availability window (From & Until) is required' });
    }

    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } })
      .populate('applicantId', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const job = application.jobId;
    const roundInfo = job.rounds.find(r => r.roundNumber === roundNumber);
    const roundName = roundInfo ? roundInfo.name : `Round ${roundNumber}`;

    const type = roundType || 'interview';

    const scheduleEntry = {
      roundNumber,
      roundName,
      roundType: type,
      assessmentConfig: type === 'assessment' ? {
        assessmentType: assessmentConfig.assessmentType,
        numQuestions:   assessmentConfig.numQuestions,
        difficulty: {
          easy:   assessmentConfig.difficulty?.easy   ?? 40,
          medium: assessmentConfig.difficulty?.medium ?? 40,
          hard:   assessmentConfig.difficulty?.hard   ?? 20,
        },
        duration:       assessmentConfig.duration,
        availableFrom:  assessmentConfig.availableFrom,
        availableUntil: assessmentConfig.availableUntil,
      } : undefined,
      interviewConfig: type === 'interview' ? {
        scheduledAt:  new Date(interviewConfig.scheduledAt),
        meetingLink:  interviewConfig.meetingLink || '',
        notes:        interviewConfig.notes       || '',
      } : undefined,
    };

    const existingIdx = application.roundSchedules.findIndex(rs => rs.roundNumber === roundNumber);
    if (existingIdx >= 0) {
      application.roundSchedules[existingIdx] = scheduleEntry;
    } else {
      application.roundSchedules.push(scheduleEntry);
    }
    await application.save();

    // Build notification message
    let notifMessage;
    if (type === 'assessment') {
      const from = new Date(assessmentConfig.availableFrom).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const until = new Date(assessmentConfig.availableUntil).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      notifMessage = `Your ${roundName} for "${job.jobTitle}" at ${job.companyId.name} is an online assessment (${assessmentConfig.assessmentType}, ${assessmentConfig.duration} mins). Available: ${from} – ${until}. Open the Interviews tab to attempt it.`;
    } else {
      const formattedDate = new Date(interviewConfig.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
      notifMessage = `Your ${roundName} for "${job.jobTitle}" at ${job.companyId.name} is scheduled on ${formattedDate}${interviewConfig.meetingLink ? ` — Join: ${interviewConfig.meetingLink}` : ''}.${interviewConfig.notes ? ` Note: ${interviewConfig.notes}` : ''}`;
    }

    await createNotification({
      recipientId: application.applicantId._id,
      type: 'round_scheduled',
      title: `📅 ${roundName} Scheduled`,
      message: notifMessage,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
      roundNumber,
    });

    res.json({ message: 'Round scheduled successfully', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Advance to next round
// @route   PUT /api/applications/:id/advance
// @access  Private (Company only)
const advanceRound = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } })
      .populate('applicantId', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const job = application.jobId;
    const totalRounds = job.rounds.length;
    const nextRound = application.currentRound + 1;

    if (nextRound > totalRounds) {
      return res.status(400).json({ message: 'Candidate is already at the final round. Use mark-hired instead.' });
    }

    application.currentRound = nextRound;
    await application.save();

    const nextRoundInfo = job.rounds.find(r => r.roundNumber === nextRound);
    const nextRoundName = nextRoundInfo ? nextRoundInfo.name : `Round ${nextRound}`;

    await createNotification({
      recipientId: application.applicantId._id,
      type: 'round_advanced',
      title: `✅ Advanced to ${nextRoundName}`,
      message: `Congratulations! You have been advanced to ${nextRoundName} for "${job.jobTitle}" at ${job.companyId.name}. Await schedule details.`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
      roundNumber: nextRound,
    });

    res.json({ message: `Advanced to Round ${nextRound}`, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark as hired (final selection)
// @route   PUT /api/applications/:id/hire
// @access  Private (Company only)
const markHired = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } })
      .populate('applicantId', 'name');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = 'hired';
    application.hiredAt = new Date();
    await application.save();

    const job = application.jobId;
    await createNotification({
      recipientId: application.applicantId._id,
      type: 'hired',
      title: '🎊 You\'re Hired!',
      message: `Congratulations, ${application.applicantId.name}! You have been selected for "${job.jobTitle}" at ${job.companyId.name}. Welcome aboard!`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
    });

    res.json({ message: 'Candidate marked as hired', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's job applications
// @route   GET /api/applications/my-applications
// @access  Private (Professional only)
const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate({
        path: 'jobId',
        populate: {
          path: 'companyId',
          select: 'name profileImage email verificationStatus companyDetails',
        },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all applications for a company's job
// @route   GET /api/applications/job/:jobId
// @access  Private (Company only)
const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
    }

    const applications = await Application.find({ jobId })
      .populate('applicantId', 'name headline bio skills profileImage email resume')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createApplication,
  acceptApplication,
  rejectApplication,
  scheduleRound,
  advanceRound,
  markHired,
  getUserApplications,
  getJobApplicants,
};
