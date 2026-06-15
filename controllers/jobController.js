const Job = require('../models/Job');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Company only)
const createJob = async (req, res) => {
  try {
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Only verified companies can post jobs' });
    }

    const { jobTitle, description, requiredSkills, salary, location, jobType, rounds, applicationForm, shareToFeed } = req.body;

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

    // Share to feed and notify followers if requested
    if (shareToFeed) {
      try {
        const company = await User.findById(req.user._id);

        // 1. Create a feed post promoting the job
        await Post.create({
          userId: req.user._id,
          content: `📢 We are hiring! We just posted a new job opening: "${jobTitle}".\n📍 Location: ${location}\n💰 Salary: ${salary}\n💼 Type: ${jobType || 'Full-time'}\n\nCheck it out and apply on our jobs page!`,
          image: '',
          likes: [],
          comments: [],
        });

        // 2. Notify all followers of the company
        if (company && company.followers && company.followers.length > 0) {
          const notifications = company.followers.map(followerId => ({
            recipientId: followerId,
            type: 'job_posted',
            title: `New Job Alert from ${company.name}!`,
            message: `We are hiring for the role of "${jobTitle}" in ${location}. Apply now!`,
            relatedJobId: job._id,
          }));
          await Notification.insertMany(notifications);
        }
      } catch (err) {
        console.error('Failed to broadcast job to feed/followers:', err);
      }
    }

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
