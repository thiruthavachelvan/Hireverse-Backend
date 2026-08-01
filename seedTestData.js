// seedTestData.js
// Creates one job per company, each with a SINGLE round of a different type.
// All rounds are set as currentRound=1 so they're immediately startable.
// Run: node seedTestData.js   OR   POST /api/admin/seed-test-data

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User        = require('./models/User');
const Job         = require('./models/Job');
const Application = require('./models/Application');

// ─── One entry per company → one job → one round type ────────────────────────
const SEED_DATA = [
  {
    company: { name: 'AlphaTech',       email: 'contact@alphatech.io',    industry: 'SaaS',          location: 'Bangalore, India' },
    jobTitle: 'Frontend Developer',
    description: 'Build pixel-perfect UI components in React.',
    skills: ['React', 'CSS', 'TypeScript'],
    salary: '₹10-14 LPA', location: 'Remote', jobType: 'Full-time',
    round: { num: 1, name: 'Aptitude Test',    type: 'Aptitude MCQ',    questions: 15, duration: 30,  difficulty: { easy: 60, medium: 30, hard: 10 } },
  },
  {
    company: { name: 'BetaLabs',        email: 'hr@betalabs.co',          industry: 'FinTech',       location: 'Delhi, India' },
    jobTitle: 'Backend Engineer',
    description: 'Design scalable APIs and microservices.',
    skills: ['Node.js', 'PostgreSQL', 'Docker'],
    salary: '₹12-16 LPA', location: 'Hyderabad', jobType: 'Full-time',
    round: { num: 1, name: 'Technical MCQ',    type: 'Technical MCQ',   questions: 20, duration: 35,  difficulty: { easy: 40, medium: 50, hard: 10 } },
  },
  {
    company: { name: 'GammaWorks AI',   email: 'jobs@gammaworks.ai',      industry: 'AI/ML',         location: 'Hyderabad, India' },
    jobTitle: 'Software Engineer',
    description: 'Solve algorithmic problems and build efficient systems.',
    skills: ['Python', 'Data Structures', 'Algorithms'],
    salary: '₹15-20 LPA', location: 'Remote', jobType: 'Full-time',
    round: { num: 1, name: 'Coding Challenge', type: 'Coding Round',    questions: 2,  duration: 90,  difficulty: { easy: 0, medium: 70, hard: 30 } },
  },
  {
    company: { name: 'DeltaHR',         email: 'talent@deltahr.co',       industry: 'HRTech',        location: 'Mumbai, India' },
    jobTitle: 'People Operations Lead',
    description: 'Lead culture-first hiring and onboarding at DeltaHR.',
    skills: ['Communication', 'Empathy', 'HR Policy'],
    salary: '₹8-12 LPA', location: 'Mumbai', jobType: 'Full-time',
    round: { num: 1, name: 'Culture Fit',      type: 'Culture Fit',     questions: 8,  duration: 20,  difficulty: { easy: 100, medium: 0, hard: 0 } },
  },
  {
    company: { name: 'EpsilonSystems',  email: 'dev@epsilonsys.com',      industry: 'DevOps',        location: 'Pune, India' },
    jobTitle: 'DevOps Engineer',
    description: 'Manage CI/CD pipelines and cloud infrastructure.',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
    salary: '₹14-18 LPA', location: 'Pune', jobType: 'Full-time',
    round: { num: 1, name: 'DevOps Assessment', type: 'DevOps',         questions: 3,  duration: 60,  difficulty: { easy: 20, medium: 60, hard: 20 } },
  },
  {
    company: { name: 'ZetaDesign',      email: 'studio@zetadesign.io',    industry: 'Design',        location: 'Chennai, India' },
    jobTitle: 'Product Designer',
    description: 'Create intuitive user experiences and design systems.',
    skills: ['Figma', 'User Research', 'Prototyping'],
    salary: '₹10-15 LPA', location: 'Chennai', jobType: 'Full-time',
    round: { num: 1, name: 'Design Challenge', type: 'UI/UX Design',    questions: 1,  duration: 90,  difficulty: { easy: 0, medium: 100, hard: 0 } },
  },
  {
    company: { name: 'EtaFoundry',      email: 'founders@etafoundry.com', industry: 'Startup',       location: 'Bangalore, India' },
    jobTitle: 'Founding Engineer',
    description: 'Join as an early engineer and shape the product roadmap.',
    skills: ['Entrepreneurship', 'Full-Stack', 'Leadership'],
    salary: '₹20-30 LPA + Equity', location: 'Remote', jobType: 'Full-time',
    round: { num: 1, name: 'Founder Challenge', type: 'Founder Challenge', questions: 1, duration: 45, difficulty: { easy: 0, medium: 100, hard: 0 } },
  },
  {
    company: { name: 'ThetaCloud',      email: 'infra@thetacloud.in',     industry: 'Cloud',         location: 'Delhi, India' },
    jobTitle: 'System Architect',
    description: 'Design distributed systems at scale.',
    skills: ['System Design', 'Microservices', 'AWS'],
    salary: '₹25-35 LPA', location: 'Remote', jobType: 'Full-time',
    round: { num: 1, name: 'System Design Round', type: 'System Design', questions: 1, duration: 60, difficulty: { easy: 0, medium: 100, hard: 0 } },
  },
  {
    company: { name: 'IotaSecure',      email: 'sec@iotasecure.io',       industry: 'Cybersecurity', location: 'Hyderabad, India' },
    jobTitle: 'Security Engineer',
    description: 'Identify vulnerabilities and build secure systems.',
    skills: ['Penetration Testing', 'OWASP', 'Linux'],
    salary: '₹16-22 LPA', location: 'Hyderabad', jobType: 'Full-time',
    round: { num: 1, name: 'Security CTF', type: 'Cybersecurity',       questions: 3,  duration: 75,  difficulty: { easy: 10, medium: 60, hard: 30 } },
  },
  {
    company: { name: 'KappaPM',         email: 'growth@kappapm.com',      industry: 'Product',       location: 'Mumbai, India' },
    jobTitle: 'Product Manager',
    description: 'Drive product strategy and roadmap for a SaaS platform.',
    skills: ['Product Strategy', 'Agile', 'Analytics'],
    salary: '₹18-24 LPA', location: 'Mumbai', jobType: 'Full-time',
    round: { num: 1, name: 'Product Thinking', type: 'Product Thinking', questions: 1, duration: 60, difficulty: { easy: 0, medium: 100, hard: 0 } },
  },
  {
    company: { name: 'LambdaQA',        email: 'qa@lambdatest.co',        industry: 'QA/Testing',    location: 'Pune, India' },
    jobTitle: 'QA Engineer',
    description: 'Build automated test suites and ensure product quality.',
    skills: ['Selenium', 'Jest', 'Cypress', 'API Testing'],
    salary: '₹8-12 LPA', location: 'Pune', jobType: 'Full-time',
    round: { num: 1, name: 'QA Testing Round', type: 'QA Testing',      questions: 3,  duration: 45,  difficulty: { easy: 20, medium: 60, hard: 20 } },
  },
  {
    company: { name: 'MuStartups',      email: 'hr@mustartups.io',        industry: 'HR/People',     location: 'Bangalore, India' },
    jobTitle: 'Business Development Lead',
    description: 'Drive partnerships and growth for an early-stage startup.',
    skills: ['Communication', 'Sales', 'Negotiation'],
    salary: '₹10-15 LPA', location: 'Remote', jobType: 'Full-time',
    round: { num: 1, name: 'Behavioral Interview', type: 'Behavioral',   questions: 6,  duration: 25,  difficulty: { easy: 100, medium: 0, hard: 0 } },
  },
];

async function runSeed() {
  if (mongoose.connection.readyState !== 1) {
    require('dotenv').config();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  }

  const profEmail = 'thiru.demo@hireverse.com';
  const professional = await User.findOne({ email: profEmail });
  if (!professional) {
    throw new Error(`Candidate not found: ${profEmail}. Please register this user first.`);
  }
  console.log(`✅ Candidate: ${professional.name}`);

  const hashedPassword = await bcrypt.hash('Demo@123', 10);
  const results = [];

  for (const def of SEED_DATA) {
    // ── Upsert company ────────────────────────────────────────────
    let company = await User.findOne({ email: def.company.email });
    if (!company) {
      company = await User.create({
        name:            def.company.name,
        email:           def.company.email,
        password:        hashedPassword,
        accountType:     'company',
        verificationStatus: 'verified',
        companyDetails: {
          website:      `https://${def.company.email.split('@')[1]}`,
          industry:     def.company.industry,
          size:         '11-50',
          location:     def.company.location,
          description:  `${def.company.name} — building bold products for the future.`,
          startupStage: 'Seed',
        },
      });
      console.log(`  ✅ Company: ${def.company.name}`);
    }

    // ── Upsert job (single round only) ────────────────────────────
    let job = await Job.findOne({ companyId: company._id, jobTitle: def.jobTitle });
    if (!job) {
      job = await Job.create({
        companyId:     company._id,
        jobTitle:      def.jobTitle,
        description:   def.description,
        requiredSkills: def.skills,
        salary:        def.salary,
        location:      def.location,
        jobType:       def.jobType,
        isActive:      true,
        rounds: [{
          roundNumber:   def.round.num,
          name:          def.round.name,
          hasAssessment: true,
          assessmentDetails: {
            type:         def.round.type,
            numQuestions: def.round.questions,
            difficulty:   def.round.difficulty,
            duration:     def.round.duration,
          },
        }],
      });
      console.log(`  ✅ Job: ${def.jobTitle} @ ${def.company.name} (${def.round.type})`);
    }

    // ── Delete old → create fresh application (round 1 active) ───
    await Application.deleteMany({ jobId: job._id, applicantId: professional._id });

    const app = await Application.create({
      jobId:              job._id,
      applicantId:        professional._id,
      status:             'in_round',
      currentRound:       1,            // Round 1 = active → Start Test button shows
      currentRoundStatus: 'Scheduled',
      roundSchedules: [{
        roundNumber:  1,
        roundName:    def.round.name,
        roundType:    'assessment',
        status:       'Scheduled',
        assessmentConfig: {
          assessmentType: def.round.type,
          numQuestions:   def.round.questions,
          difficulty:     def.round.difficulty,
          duration:       def.round.duration,
          // No availableFrom/Until → always open for testing
        },
      }],
    });

    console.log(`  ✅ Application: ${def.round.type} round active`);
    results.push({
      company:  def.company.name,
      job:      def.jobTitle,
      round:    def.round.type,
      duration: `${def.round.duration} min`,
    });
  }

  console.log('\n🎉 Seed complete!');
  return results;
}

if (require.main === module) {
  runSeed()
    .then(r => { console.table(r); process.exit(0); })
    .catch(e => { console.error('❌', e.message); process.exit(1); });
}

module.exports = { runSeed };
