const Job = require('../models/Job');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Company only)
const createJob = async (req, res) => {
  try {
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Only verified companies can post jobs' });
    }

    const { jobTitle, description, requiredSkills, salary, location, jobType, rounds, applicationForm } = req.body;

    if (!jobTitle || !description || !salary || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let skillsArray = [];
    if (requiredSkills) {
      if (Array.isArray(requiredSkills)) {
        skillsArray = requiredSkills.map(s => s.trim()).filter(Boolean);
      } else {
        skillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Validate rounds array
    let roundsArray = [];
    if (rounds && Array.isArray(rounds)) {
      roundsArray = rounds.map((r, idx) => ({
        roundNumber: idx + 1,
        name: r.name || `Round ${idx + 1}`,
      }));
    }

    // Validate application form questions
    let formQuestions = [];
    if (applicationForm && Array.isArray(applicationForm)) {
      formQuestions = applicationForm.map(q => ({
        question: q.question,
        required: q.required !== undefined ? q.required : true,
      })).filter(q => q.question && q.question.trim());
    }

    const job = await Job.create({
      companyId: req.user._id,
      jobTitle,
      description,
      requiredSkills: skillsArray,
      salary,
      location,
      jobType: jobType || 'Full-time',
      rounds: roundsArray,
      applicationForm: formQuestions,
      applicants: [],
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all jobs (with company verification status)
// @route   GET /api/jobs
// @access  Private
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('companyId', 'name profileImage headline email verificationStatus companyDetails')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name profileImage headline email verificationStatus companyDetails bio');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get jobs posted by the logged-in company
// @route   GET /api/jobs/company
// @access  Private (Company only)
const getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user._id })
      .populate('companyId', 'name profileImage email verificationStatus')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle job active status
// @route   PUT /api/jobs/:id/toggle-active
// @access  Private (Company only)
const toggleJobActive = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.isActive = !job.isActive;
    await job.save();
    res.json({ message: `Job ${job.isActive ? 'activated' : 'closed'}`, isActive: job.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  getCompanyJobs,
  toggleJobActive,
};
