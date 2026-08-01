// seedTestData.js
// Run with: node server/seedTestData.js
// This script creates three sample companies, each posting a job with distinct assessment rounds, and assigns the current professional user (thiruthavachelvan) to all of them for testing.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/hireverse', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // ---------- 1️⃣ Ensure professional user exists ----------
    const profEmail = 'thiru.demo@hireverse.com';
    let professional = await User.findOne({ email: profEmail });
    if (!professional) {
      professional = await User.create({
        name: 'Thiruthavachelvan',
        email: profEmail,
        password: 'Demo@123', // In production this would be hashed via registration flow
        accountType: 'professional',
        employmentStatus: 'unemployed',
      });
      console.log('Created professional account');
    }

    // ---------- 2️⃣ Create sample companies ----------
    const companiesData = [
      { name: 'AlphaTech', email: 'contact@alphatech.io', password: 'Demo@123', accountType: 'company', companyDetails: { website: 'https://alphatech.io', industry: 'SaaS', size: '51-200', location: 'Bangalore', description: 'Innovative SaaS platform.' } },
      { name: 'BetaLabs', email: 'hr@betalabs.co', password: 'Demo@123', accountType: 'company', companyDetails: { website: 'https://betalabs.co', industry: 'FinTech', size: '201-500', location: 'Delhi', description: 'FinTech solutions for SMEs.' } },
      { name: 'GammaWorks', email: 'jobs@gammaworks.com', password: 'Demo@123', accountType: 'company', companyDetails: { website: 'https://gammaworks.com', industry: 'AI/ML', size: '51-200', location: 'Hyderabad', description: 'AI-driven product suite.' } },
    ];

    const companyIds = [];
    for (const comp of companiesData) {
      let company = await User.findOne({ email: comp.email });
      if (!company) {
        company = await User.create(comp);
        console.log(`Created company ${comp.name}`);
      }
      companyIds.push(company._id);
    }

    // ---------- 3️⃣ Create jobs with distinct round mixes ----------
    const jobsData = [
      {
        companyId: companyIds[0],
        jobTitle: 'Full‑Stack Engineer',
        description: 'Build and scale modern web applications.',
        requiredSkills: ['React', 'Node.js', 'MongoDB'],
        salary: '₹12‑15LPA',
        location: 'Remote',
        jobType: 'Full-time',
        rounds: [
          { roundNumber: 1, name: 'Aptitude Test', hasAssessment: true, assessmentDetails: { type: 'Aptitude MCQ', numQuestions: 20, difficulty: { easy: 60, medium: 30, hard: 10 }, duration: 30 } },
          { roundNumber: 2, name: 'Coding Challenge', hasAssessment: true, assessmentDetails: { type: 'Coding Round', numQuestions: 3, difficulty: { easy: 0, medium: 80, hard: 20 }, duration: 90 } },
          { roundNumber: 3, name: 'Culture Fit', hasAssessment: true, assessmentDetails: { type: 'Cultural Fit', numQuestions: 5, difficulty: { easy: 100, medium: 0, hard: 0 }, duration: 15 } },
        ],
      },
      {
        companyId: companyIds[1],
        jobTitle: 'Data Analyst',
        description: 'Analyse data to drive product decisions.',
        requiredSkills: ['SQL', 'Python', 'Tableau'],
        salary: '₹8‑10LPA',
        location: 'Bengaluru',
        jobType: 'Full-time',
        rounds: [
          { roundNumber: 1, name: 'Technical MCQ', hasAssessment: true, assessmentDetails: { type: 'Technical MCQ', numQuestions: 25, difficulty: { easy: 50, medium: 40, hard: 10 }, duration: 35 } },
          { roundNumber: 2, name: 'Case Study', hasAssessment: true, assessmentDetails: { type: 'Case Study', numQuestions: 1, difficulty: { easy: 0, medium: 100, hard: 0 }, duration: 60 } },
        ],
      },
      {
        companyId: companyIds[2],
        jobTitle: 'AI Research Engineer',
        description: 'Research and prototype AI models.',
        requiredSkills: ['PyTorch', 'TensorFlow', 'Python'],
        salary: '₹20‑25LPA',
        location: 'Remote',
        jobType: 'Full-time',
        rounds: [
          { roundNumber: 1, name: 'Coding/ML Challenge', hasAssessment: true, assessmentDetails: { type: 'Coding Round', numQuestions: 2, difficulty: { easy: 0, medium: 70, hard: 30 }, duration: 120 } },
          { roundNumber: 2, name: 'Founder Challenge', hasAssessment: true, assessmentDetails: { type: 'Founder Challenge', numQuestions: 1, difficulty: { easy: 0, medium: 100, hard: 0 }, duration: 45 } },
          { roundNumber: 3, name: 'Cultural Fit', hasAssessment: true, assessmentDetails: { type: 'Cultural Fit', numQuestions: 5, difficulty: { easy: 100, medium: 0, hard: 0 }, duration: 15 } },
        ],
      },
    ];

    const jobIds = [];
    for (const jobInfo of jobsData) {
      let job = await Job.findOne({ companyId: jobInfo.companyId, jobTitle: jobInfo.jobTitle });
      if (!job) {
        job = await Job.create(jobInfo);
        console.log(`Created job: ${jobInfo.jobTitle}`);
      }
      jobIds.push(job._id);
    }

    // ---------- 4️⃣ Create applications for the professional ----------
    for (const jobId of jobIds) {
      const existingApp = await Application.findOne({ jobId, applicantId: professional._id });
      if (!existingApp) {
        const job = await Job.findById(jobId);
        const roundSchedules = job.rounds.map(r => ({
          roundNumber: r.roundNumber,
          roundName: r.name,
          roundType: 'assessment',
          assessmentConfig: {
            assessmentType: r.assessmentDetails.type,
            numQuestions: r.assessmentDetails.numQuestions,
            difficulty: r.assessmentDetails.difficulty,
            duration: r.assessmentDetails.duration,
          },
        }));
        await Application.create({
          jobId,
          applicantId: professional._id,
          roundSchedules,
        });
        console.log(`Created application for job ${job.jobTitle}`);
      }
    }

    console.log('All test data seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
})();
