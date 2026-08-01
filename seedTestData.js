// seedTestData.js
// Run with: node seedTestData.js   (from the server/ directory)
// OR triggered via POST /api/admin/seed-test-data (admin token required)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

// ─── Map round names → valid assessmentType enum values ─────────────────────
// Application.assessmentConfig.assessmentType must be one of these values.
// These also map to AssessmentEngine workspace components.
const VALID_TYPES = {
  'Aptitude MCQ':     'Aptitude MCQ',
  'Technical MCQ':    'Technical MCQ',
  'Coding Round':     'Coding Round',
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
  'HR Interview':     'HR Interview',
  'Resume Screening': 'Resume Screening',
  'Assignment':       'Assignment',
  'Case Study':       'Case Study',
};

const jobsData = [
  {
    company: { name: 'AlphaTech', email: 'contact@alphatech.io', industry: 'SaaS', location: 'Bangalore' },
    jobTitle: 'Full-Stack Engineer',
    description: 'Build and scale modern full-stack web applications using React and Node.js.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
    salary: '₹12-15 LPA',
    location: 'Remote',
    jobType: 'Full-time',
    rounds: [
      { roundNumber: 1, name: 'Aptitude Test',   type: 'Aptitude MCQ',   questions: 20, duration: 30, difficulty: { easy: 60, medium: 30, hard: 10 } },
      { roundNumber: 2, name: 'Coding Challenge', type: 'Coding Round',   questions: 3,  duration: 90, difficulty: { easy: 0,  medium: 70, hard: 30 } },
      { roundNumber: 3, name: 'Culture Fit',      type: 'Culture Fit',    questions: 5,  duration: 15, difficulty: { easy: 100,medium: 0,  hard: 0  } },
    ],
  },
  {
    company: { name: 'BetaLabs', email: 'hr@betalabs.co', industry: 'FinTech', location: 'Delhi' },
    jobTitle: 'Data Analyst',
    description: 'Analyse data pipelines and build dashboards to drive product decisions.',
    requiredSkills: ['SQL', 'Python', 'Tableau', 'Statistics'],
    salary: '₹8-10 LPA',
    location: 'Bengaluru',
    jobType: 'Full-time',
    rounds: [
      { roundNumber: 1, name: 'Technical MCQ',   type: 'Technical MCQ',   questions: 25, duration: 35, difficulty: { easy: 50, medium: 40, hard: 10 } },
      { roundNumber: 2, name: 'Debugging Round', type: 'Debugging',        questions: 3,  duration: 45, difficulty: { easy: 30, medium: 50, hard: 20 } },
      { roundNumber: 3, name: 'Behavioral',      type: 'Behavioral',       questions: 5,  duration: 20, difficulty: { easy: 100,medium: 0,  hard: 0  } },
    ],
  },
  {
    company: { name: 'GammaWorks', email: 'jobs@gammaworks.com', industry: 'AI/ML', location: 'Hyderabad' },
    jobTitle: 'AI Research Engineer',
    description: 'Research and prototype cutting-edge AI/ML models for production-grade systems.',
    requiredSkills: ['PyTorch', 'TensorFlow', 'Python', 'Linear Algebra'],
    salary: '₹20-25 LPA',
    location: 'Remote',
    jobType: 'Full-time',
    rounds: [
      { roundNumber: 1, name: 'Aptitude Screen',   type: 'Aptitude MCQ',     questions: 15, duration: 25, difficulty: { easy: 50, medium: 40, hard: 10 } },
      { roundNumber: 2, name: 'ML Coding Round',   type: 'Coding Round',      questions: 2,  duration: 120,difficulty: { easy: 0,  medium: 70, hard: 30 } },
      { roundNumber: 3, name: 'System Design',     type: 'System Design',     questions: 1,  duration: 60, difficulty: { easy: 0,  medium: 100,hard: 0  } },
      { roundNumber: 4, name: 'Founder Challenge', type: 'Founder Challenge',  questions: 1,  duration: 45, difficulty: { easy: 0,  medium: 100,hard: 0  } },
      { roundNumber: 5, name: 'Cultural Fit',      type: 'Culture Fit',        questions: 5,  duration: 15, difficulty: { easy: 100,medium: 0,  hard: 0  } },
    ],
  },
];

async function runSeed(mongoUri) {
  const uri = mongoUri || process.env.MONGO_URI;
  let alreadyConnected = mongoose.connection.readyState === 1;
  if (!alreadyConnected) {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ MongoDB connected');
  }

  // ── 1. Find candidate ──────────────────────────────────────────
  const profEmail = 'thiru.demo@hireverse.com';
  const professional = await User.findOne({ email: profEmail });
  if (!professional) {
    throw new Error(`Candidate not found: ${profEmail}. Please ensure the user is registered first.`);
  }
  console.log(`✅ Found candidate: ${professional.name} (${professional._id})`);

  const results = [];

  for (const def of jobsData) {
    // ── 2. Ensure company exists ─────────────────────────────────
    let company = await User.findOne({ email: def.company.email });
    if (!company) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash('Demo@123', 10);
      company = await User.create({
        name: def.company.name,
        email: def.company.email,
        password: hashed,
        accountType: 'company',
        verificationStatus: 'verified',
        companyDetails: {
          website: `https://${def.company.email.split('@')[1]}`,
          industry: def.company.industry,
          size: '51-200',
          location: def.company.location,
          description: `${def.company.name} — building products that matter.`,
          startupStage: 'Series A',
        },
      });
      console.log(`✅ Created company: ${def.company.name}`);
    } else {
      console.log(`ℹ️  Company exists: ${def.company.name}`);
    }

    // ── 3. Create or update job ──────────────────────────────────
    let job = await Job.findOne({ companyId: company._id, jobTitle: def.jobTitle });
    const jobRounds = def.rounds.map(r => ({
      roundNumber: r.roundNumber,
      name: r.name,
      hasAssessment: true,
      assessmentDetails: {
        type: r.type,
        numQuestions: r.questions,
        difficulty: r.difficulty,
        duration: r.duration,
      },
    }));
    if (!job) {
      job = await Job.create({
        companyId: company._id,
        jobTitle: def.jobTitle,
        description: def.description,
        requiredSkills: def.requiredSkills,
        salary: def.salary,
        location: def.location,
        jobType: def.jobType,
        rounds: jobRounds,
        isActive: true,
      });
      console.log(`✅ Created job: ${def.jobTitle} @ ${def.company.name}`);
    } else {
      console.log(`ℹ️  Job exists: ${def.jobTitle} @ ${def.company.name}`);
    }

    // ── 4. Delete old broken application, recreate fresh ─────────
    await Application.deleteMany({ jobId: job._id, applicantId: professional._id });

    const roundSchedules = def.rounds.map(r => ({
      roundNumber: r.roundNumber,
      roundName: r.name,
      roundType: 'assessment',
      status: 'Scheduled',
      assessmentConfig: {
        assessmentType: VALID_TYPES[r.type] || 'Aptitude MCQ',
        numQuestions: r.questions,
        difficulty: r.difficulty,
        duration: r.duration,
        // No availableFrom / availableUntil → window is always open (for testing)
      },
    }));

    const app = await Application.create({
      jobId: job._id,
      applicantId: professional._id,
      status: 'in_round',
      currentRound: 1,          // ← Round 1 is the active round (so canStart = true)
      currentRoundStatus: 'Scheduled',
      roundSchedules,
    });

    console.log(`✅ Created application for ${def.jobTitle} — ${roundSchedules.length} rounds`);
    results.push({ job: def.jobTitle, company: def.company.name, applicationId: app._id, rounds: roundSchedules.length });
  }

  console.log('\n🎉 Seed complete!');
  console.table(results);
  return results;
}

// ── Run directly ──────────────────────────────────────────────────────────────
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(err => { console.error('❌ Seed error:', err.message); process.exit(1); });
}

module.exports = { runSeed };
