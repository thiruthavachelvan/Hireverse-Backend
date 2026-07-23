const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hireverse';

const hashPwd = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
};

// ── Startup Categories ──────────────────────────────────────────
const INDUSTRIES = [
  'AI', 'FinTech', 'HealthTech', 'EdTech', 'Gaming',
  'SaaS', 'ClimateTech', 'E-Commerce', 'Developer Tools', 'Robotics'
];

const STAGES = ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B'];

// ── 25 Startup Templates ─────────────────────────────────────────
const STARTUPS_TEMPLATES = [
  { name: 'NovaTech AI', email: 'hr@novatechai.demo', industry: 'AI', size: '11-25', stage: 'Seed', location: 'Bangalore', founders: 'Aravind Swamy, Priya Nair' },
  { name: 'PixelForge Labs', email: 'admin@pixelforge.demo', industry: 'Developer Tools', size: '26-50', stage: 'Series A', location: 'Remote', founders: 'Rohan Mehta' },
  { name: 'FinFlow', email: 'careers@finflow.demo', industry: 'FinTech', size: '51-100', stage: 'Series B', location: 'Mumbai', founders: 'Vikram Seth, Kabir Sen' },
  { name: 'HealthSync', email: 'team@healthsync.demo', industry: 'HealthTech', size: '1-10', stage: 'Bootstrapped', location: 'Delhi', founders: 'Dr. Sameer Khan, Anjali Roy' },
  { name: 'EduSpark', email: 'jobs@eduspark.demo', industry: 'EdTech', size: '101-250', stage: 'Series B', location: 'Bangalore', founders: 'Nitin Gadkari, Sanya Sen' },
  { name: 'GameVibe Studios', email: 'play@gamevibe.demo', industry: 'Gaming', size: '11-25', stage: 'Pre-Seed', location: 'Pune', founders: 'Tanmay Bhatt, Samay Raina' },
  { name: 'SaaSify', email: 'grow@saasify.demo', industry: 'SaaS', size: '26-50', stage: 'Series A', location: 'Remote', founders: 'Meera Deshmukh' },
  { name: 'EcoSphere Solutions', email: 'hello@ecosphere.demo', industry: 'ClimateTech', size: '1-10', stage: 'Seed', location: 'Hyderabad', founders: 'Dr. Vivek Murthy' },
  { name: 'BazaarGo', email: 'ship@bazaargo.demo', industry: 'E-Commerce', size: '251-500', stage: 'Series B', location: 'Bangalore', founders: 'Karan Johar, Aditya Roy' },
  { name: 'CodeCraft', email: 'compile@codecraft.demo', industry: 'Developer Tools', size: '11-25', stage: 'Seed', location: 'Remote', founders: 'Nisha Pillai' },
  { name: 'RoboCore Systems', email: 'wire@robocore.demo', industry: 'Robotics', size: '26-50', stage: 'Series A', location: 'Chennai', founders: 'Prof. Ramalingam, Karthik R' },
  { name: 'CureAI', email: 'clinical@cureai.demo', industry: 'AI', size: '11-25', stage: 'Seed', location: 'Hyderabad', founders: 'Dr. Srinivas, Divya T' },
  { name: 'PaySwift', email: 'transact@payswift.demo', industry: 'FinTech', size: '51-100', stage: 'Series A', location: 'Mumbai', founders: 'Ritesh Agarwal' },
  { name: 'LearnLoop', email: 'study@learnloop.demo', industry: 'EdTech', size: '26-50', stage: 'Seed', location: 'Noida', founders: 'Amit Verma' },
  { name: 'PlayGrid', email: 'engine@playgrid.demo', industry: 'Gaming', size: '1-10', stage: 'Pre-Seed', location: 'Pune', founders: 'Abhishek U' },
  { name: 'CloudOps', email: 'infra@cloudops.demo', industry: 'SaaS', size: '101-250', stage: 'Series B', location: 'Bangalore', founders: 'Rahul Dravid' },
  { name: 'GreenGrid Tech', email: 'solar@greengrid.demo', industry: 'ClimateTech', size: '11-25', stage: 'Seed', location: 'Chennai', founders: 'M. S. Swaminathan' },
  { name: 'ShopKart', email: 'cart@shopkart.demo', industry: 'E-Commerce', size: '51-100', stage: 'Series A', location: 'Mumbai', founders: 'Pooja Hegde' },
  { name: 'DevPulse', email: 'monitor@devpulse.demo', industry: 'Developer Tools', size: '1-10', stage: 'Bootstrapped', location: 'Remote', founders: 'Suresh Raina' },
  { name: 'BotDynamics', email: 'gears@botdynamics.demo', industry: 'Robotics', size: '11-25', stage: 'Seed', location: 'Coimbatore', founders: 'Dr. Balaji, Ganesan S' },
  { name: 'NeuroNet AI', email: 'brain@neuronet.demo', industry: 'AI', size: '26-50', stage: 'Series A', location: 'Bangalore', founders: 'Yann LeCun, Shivam D' },
  { name: 'LedgerLine', email: 'vault@ledgerline.demo', industry: 'FinTech', size: '1-10', stage: 'Pre-Seed', location: 'Kolkata', founders: 'Saurav Ganguly' },
  { name: 'MedCheck', email: 'consult@medcheck.demo', industry: 'HealthTech', size: '26-50', stage: 'Seed', location: 'Bangalore', founders: 'Dr. Devi Shetty' },
  { name: 'SkillUP', email: 'train@skillup.demo', industry: 'EdTech', size: '51-100', stage: 'Series A', location: 'Remote', founders: 'Sachin Tendulkar' },
  { name: 'PixelPlay', email: 'render@pixelplay.demo', industry: 'Gaming', size: '101-250', stage: 'Series B', location: 'Mumbai', founders: 'Rohit Sharma' }
];

// YouTube embeds representing startup stories & culture
const VIDEO_TEMPLATES = [
  'https://www.youtube.com/embed/P6Ff585K8bM', // Startup engineering culture
  'https://www.youtube.com/embed/P28jQ11wO4o', // Life at a fast-growing startup
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo
  'https://www.youtube.com/embed/KeF1E2Xm6zM'  // Startup pitch
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear previous data
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Wiped database clean');

  // ── 1. Create Admin ────────────────────────────────────────────────────────
  const adminPwd = await hashPwd('Admin@123');
  await User.create({
    name: 'HireVerse Admin',
    email: 'admin@hireverse.demo',
    password: adminPwd,
    accountType: 'admin',
    profileImage: 'https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=8b5cf6',
  });
  console.log('👤 Admin account seeded');

  // ── 2. Create Startups (25) ────────────────────────────────────────────────
  const companyPwd = await hashPwd('Startup@123');
  const startups = [];

  for (let i = 0; i < STARTUPS_TEMPLATES.length; i++) {
    const template = STARTUPS_TEMPLATES[i];
    const foundedYear = (2018 + (i % 8)).toString();
    const vid1 = VIDEO_TEMPLATES[i % VIDEO_TEMPLATES.length];
    const vid2 = VIDEO_TEMPLATES[(i + 1) % VIDEO_TEMPLATES.length];

    const startup = await User.create({
      name: template.name,
      email: template.email,
      password: companyPwd,
      accountType: 'company',
      verificationStatus: 'verified',
      bio: `Ambitious ${template.industry} startup building the future. Driven by builder culture and high ownership.`,
      profileImage: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(template.name)}&backgroundColor=8b5cf6`,
      companyDetails: {
        website: `https://${template.name.toLowerCase().replace(/\s/g, '')}.io`,
        industry: template.industry,
        size: template.size,
        description: `${template.name} is a high-growth ${template.industry} startup founded by ${template.founders}. We value deep execution, rapid iteration, and customer obsession.`,
        location: template.location,
        upcomingHiring: 'We are expanding our product, engineering, and growth teams aggressively over the next two quarters.',
        startupStage: template.stage,
        foundedYear: foundedYear,
        founders: template.founders,
        vision: `To lead global innovation in the ${template.industry} category.`,
        startupCulture: 'High autonomy, zero bureaucracy, deep focus on shipping code and building products that users love.',
        officePhotos: [
          `https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=80`,
          `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80`
        ],
        videos: [vid1, vid2]
      }
    });
    startups.push(startup);
  }
  console.log(`🏢 Seeded ${startups.length} startup companies`);

  // ── 3. Create Professionals (102 Candidates) ──────────────────────────────
  const firstNames = ['Amit', 'Raj', 'Vikram', 'Anjali', 'Priya', 'Karthik', 'Suresh', 'Rahul', 'Nisha', 'Meera', 'Rohan', 'Neha', 'Kabir', 'Aditya', 'Divya', 'Sanya', 'Arjun', 'Sneha', 'Vijay', 'Tanvi', 'Abhishek', 'Swati', 'Manish', 'Kiran', 'Deepak'];
  const lastNames = ['Mehta', 'Nair', 'Sharma', 'Sen', 'Pillai', 'Kumar', 'Verma', 'Roy', 'Iyer', 'Patel', 'Joshi', 'Gupta', 'Singh', 'Reddy', 'Das', 'Murthy', 'Kulkarni', 'Bhatt', 'Rao', 'Deshmukh'];
  const skillsPool = ['React', 'Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'Python', 'FastAPI', 'PyTorch', 'Docker', 'AWS', 'Tailwind CSS', 'Figma', 'System Design', 'PostgreSQL', 'Go', 'Kubernetes', 'Redis', 'GraphQL', 'TensorFlow', 'Data Pipelines'];

  const candidatePwd = await hashPwd('Demo@123');

  // Hardcode Thiruthavachelvan K as the primary demo candidate
  const mainCandidate = await User.create({
    name: 'Thiruthavachelvan K',
    email: 'thiru.demo@hireverse.com',
    password: candidatePwd,
    accountType: 'professional',
    headline: 'Full-Stack Builder | Open to Startups',
    bio: 'Ambitious builder specialized in React, Node.js, and scaling developer tools. Actively looking for founding engineer or early startup roles.',
    employmentStatus: 'unemployed',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS', 'Docker'],
    workExperience: [
      { company: 'PixelForge Labs', role: 'Frontend Intern', from: '2025-01', to: '2025-06', description: 'Built components for cloud IDE, optimized rendering speeds by 40%.' }
    ],
    education: { college: 'PSG College of Technology', cgpa: '8.5', certifications: ['AWS Certified Developer'] },
    profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=Thiru&backgroundColor=transparent`
  });

  const tushar = await User.create({
    name: 'Tushar M',
    email: 'tushar.demo@hireverse.com',
    password: candidatePwd,
    accountType: 'professional',
    headline: 'Backend Engineer | Distributed Systems',
    bio: 'Passionate about high-throughput microservices, Node.js, and database optimization.',
    employmentStatus: 'unemployed',
    skills: ['Node.js', 'Go', 'PostgreSQL', 'Docker', 'Redis', 'AWS'],
    profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=Tushar&backgroundColor=transparent`
  });

  const vairavan = await User.create({
    name: 'Vairavan S',
    email: 'vairavan.demo@hireverse.com',
    password: candidatePwd,
    accountType: 'professional',
    headline: 'Full-Stack Developer | AI & SaaS Specialist',
    bio: 'Building web applications with modern stacks and integrating AI-driven workflows.',
    employmentStatus: 'unemployed',
    skills: ['React', 'Python', 'FastAPI', 'MongoDB', 'TypeScript'],
    profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=Vairavan&backgroundColor=transparent`
  });

  const harriet = await User.create({
    name: 'Harriet P',
    email: 'harriet.demo@hireverse.com',
    password: candidatePwd,
    accountType: 'professional',
    headline: 'UI/UX Engineer | Design Systems',
    bio: 'Crafting responsive user interfaces, design tokens, and smooth micro-animations.',
    employmentStatus: 'unemployed',
    skills: ['React', 'Tailwind CSS', 'Figma', 'TypeScript', 'Framer Motion'],
    profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=Harriet&backgroundColor=transparent`
  });

  const pranav = await User.create({
    name: 'Pranav R',
    email: 'pranav.demo@hireverse.com',
    password: candidatePwd,
    accountType: 'professional',
    headline: 'DevOps & Cloud Engineer | Infrastructure',
    bio: 'Automating deployment pipelines, Kubernetes orchestration, and cloud architecture.',
    employmentStatus: 'unemployed',
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=Pranav&backgroundColor=transparent`
  });

  const candidates = [mainCandidate, tushar, vairavan, harriet, pranav];

  for (let i = 1; i <= 101; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const name = `${fName} ${lName}`;
    const randSkills = [];
    for (let s = 0; s < 5 + (i % 4); s++) {
      const skill = skillsPool[(i * 2 + s) % skillsPool.length];
      if (!randSkills.includes(skill)) randSkills.push(skill);
    }

    const headlines = [
      `Software Engineer | ex-Razorpay | Seeking early stage startups`,
      `Backend Developer (Go / Node.js) | Product Builder`,
      `UI/UX Designer | Specializing in SaaS & Fintech tools`,
      `ML Engineer | Building LLMs & agentic workflows`,
      `Full-Stack Developer | Open to join founding teams`,
      `Growth Marketer | Helping startups scale from 0 to 1`
    ];

    const candidate = await User.create({
      name: name,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@builder.demo`,
      password: candidatePwd,
      accountType: 'professional',
      headline: headlines[i % headlines.length],
      bio: `Ambitious software engineer eager to solve hard problems in fast-paced startup teams. I love shipping code and building high-impact products.`,
      employmentStatus: i % 3 === 0 ? 'employed' : i % 3 === 1 ? 'unemployed' : 'recently_left',
      skills: randSkills,
      workExperience: [
        {
          company: startups[i % startups.length].name,
          role: i % 2 === 0 ? 'Software Engineer' : 'Frontend Developer',
          from: '2023-06',
          to: '2025-12',
          description: 'Designed internal dashboard portals, optimized data pipelines and managed cloud infrastructure.'
        }
      ],
      education: { college: 'IIT Madras', cgpa: '8.2', certifications: ['HackerRank Gold Badge'] },
      profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`
    });
    candidates.push(candidate);
  }
  console.log(`👥 Seeded ${candidates.length} candidate accounts`);

  // ── 4. Create Opportunities (Jobs - 2 to 4 per startup) ────────────────────
  const jobRoles = [
    { title: 'Founding Frontend Engineer', type: 'Full-time', salary: '₹18-25 LPA', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
    { title: 'Senior Backend Engineer (Go/Node)', type: 'Full-time', salary: '₹22-30 LPA', skills: ['Go', 'Node.js', 'Redis', 'PostgreSQL'] },
    { title: 'ML Researcher & Engineer', type: 'Full-time', salary: '₹35-48 LPA', skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs'] },
    { title: 'Product Designer (UI/UX)', type: 'Full-time', salary: '₹12-18 LPA', skills: ['Figma', 'Prototyping', 'Design Systems'] },
    { title: 'DevOps / Infra Lead', type: 'Full-time', salary: '₹25-35 LPA', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'] },
    { title: 'Growth & Marketing Lead', type: 'Full-time', salary: '₹10-15 LPA', skills: ['SEO', 'Content Strategy', 'Analytics'] }
  ];

  const jobs = [];

  for (let s = 0; s < startups.length; s++) {
    const startup = startups[s];
    const numJobs = 2 + (s % 3); // 2 to 4 jobs
    for (let j = 0; j < numJobs; j++) {
      const role = jobRoles[(s + j) % jobRoles.length];
      const job = await Job.create({
        companyId: startup._id,
        jobTitle: role.title,
        description: `Join ${startup.name} as a ${role.title}. You will own massive segments of our codebase, participate directly in product roadmap discussions, and help us scale to new heights. If you love shipping fast and working with zero red tape, this is for you.`,
        jobType: role.type,
        location: startup.companyDetails.location,
        salary: role.salary,
        requiredSkills: role.skills,
        rounds: [
          {
            roundNumber: 1,
            name: 'Framer Challenge / MCQ test',
            hasAssessment: true,
            assessmentDetails: {
              type: 'Technical MCQ',
              numQuestions: 20,
              duration: 30
            }
          },
          { roundNumber: 2, name: 'System Design Panel', hasAssessment: false },
          { roundNumber: 3, name: 'Culture Fit Call with Founders', hasAssessment: false }
        ]
      });
      jobs.push(job);
    }
  }
  console.log(`💼 Seeded ${jobs.length} opportunities (jobs)`);

  // ── 5. Setup Follows/Connections ───────────────────────────────────────────
  // Let candidates follow startups & startups follow back
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    // Each candidate follows 3-6 random startups
    const numFollow = 3 + (i % 4);
    for (let f = 0; f < numFollow; f++) {
      const startup = startups[(i * 3 + f) % startups.length];
      if (!candidate.following.includes(startup._id)) {
        candidate.following.push(startup._id);
        startup.followers.push(candidate._id);
      }
    }
    await candidate.save();
  }
  for (const startup of startups) {
    await startup.save();
  }
  console.log('🔗 Seeded follow relationships');

  // ── 6. Create Startup Feed Posts ───────────────────────────────────────────
  const feedPosts = [
    { content: '🚀 Just closed our Pre-seed round of $750K! Ambitious builders, we are hiring our founding engineering team. DMs are wide open. Let’s build the future together. #Funding #Startups', indexOffset: 0 },
    { content: '💡 Startup culture means shipping products fast, gathering immediate customer feedback, and iterating daily. No meeting marathons, just execution. Agree? #Culture #Builders', indexOffset: 1 },
    { content: '🔥 Check out our product demo video showing our latest developer console. Feedback is greatly appreciated! Link: https://youtu.be/P6Ff585K8bM #ProductDemo #DevTools', indexOffset: 2 },
    { content: '🛠️ Migrated our entire API suite to Go this week. CPU usage dropped by 75% and latency is down to single-digit milliseconds. Big win for our core infra team! #Go #Performance', indexOffset: 3 },
    { content: '📣 Recruiting founding designer: If you love designing clean, interactive products and working closely with engineers, we have a desk waiting for you! #DesignJobs #SaaS', indexOffset: 4 }
  ];

  const posts = [];
  // Seed startup posts
  for (let s = 0; s < startups.length; s++) {
    const startup = startups[s];
    const postTemplate = feedPosts[s % feedPosts.length];
    const post = await Post.create({
      userId: startup._id,
      content: postTemplate.content,
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - (s * 4 * 3600000))
    });
    posts.push(post);
  }

  // Seed some builder candidate posts
  for (let c = 0; c < 15; c++) {
    const candidate = candidates[c];
    const post = await Post.create({
      userId: candidate._id,
      content: `Just built a custom React hooks package to manage real-time updates over WebSockets. Leveraged Framer Motion for smooth state changes. Ship fast, refine later! #BuildInPublic #React #Coding`,
      likes: [],
      comments: []
    });
    posts.push(post);
  }

  // Add random likes & comments to feed posts
  for (const post of posts) {
    // Add 5-15 random likes
    const numLikes = 5 + (post._id.toString().charCodeAt(10) % 11);
    for (let l = 0; l < numLikes; l++) {
      const liker = candidates[(l * 4) % candidates.length];
      if (!post.likes.includes(liker._id)) {
        post.likes.push(liker._id);
      }
    }
    // Add 1-3 comments
    const numComments = 1 + (post._id.toString().charCodeAt(11) % 3);
    for (let c = 0; c < numComments; c++) {
      const commenter = candidates[(c * 7) % candidates.length];
      post.comments.push({
        userId: commenter._id,
        text: c === 0 ? 'Super cool! Keep shipping.' : 'Would love to see the GitHub repo link.',
        createdAt: new Date()
      });
    }
    await post.save();
  }
  console.log(`📝 Seeded ${posts.length} startup feed posts with likes/comments`);

  // ── 7. Seed Applications (Apply candidates to jobs) ──────────────────────
  // Apply our primary demo candidate (Thiru) to 4 jobs to showcase progress dashboard
  for (let j = 0; j < 4; j++) {
    const job = jobs[j];
    const startup = startups[j % startups.length];
    await Application.create({
      jobId: job._id,
      applicantId: mainCandidate._id,
      status: j === 0 ? 'submitted' : j === 1 ? 'under_review' : j === 2 ? 'in_round' : 'hired',
      currentRound: j === 2 ? 2 : 1,
      roundSchedules: [
        {
          roundNumber: 1,
          roundName: 'Framer Challenge / MCQ test',
          roundType: 'assessment',
          status: 'Completed',
          assessmentCompleted: true,
          assessmentConfig: {
            assessmentType: 'Technical MCQ',
            numQuestions: 20,
            duration: 30
          },
          attemptId: new mongoose.Types.ObjectId()
        },
        ...(j === 2 ? [{
          roundNumber: 2,
          roundName: 'System Design Panel',
          roundType: 'interview',
          status: 'Scheduled',
          interviewConfig: {
            scheduledAt: new Date(Date.now() + 86400000 * 2),
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            notes: 'Prepare a 15-minute whiteboard overview of a scalable chat system.'
          }
        }] : [])
      ]
    });
  }

  // Apply another 50 candidates to random jobs
  for (let a = 0; a < 80; a++) {
    const candidate = candidates[a % candidates.length];
    const job = jobs[a % jobs.length];

    // Avoid duplicate applications
    const exists = await Application.findOne({ jobId: job._id, applicantId: candidate._id });
    if (!exists) {
      await Application.create({
        jobId: job._id,
        applicantId: candidate._id,
        status: a % 5 === 0 ? 'in_round' : a % 5 === 1 ? 'under_review' : 'submitted',
        currentRound: a % 5 === 0 ? 2 : 1,
        roundSchedules: []
      });
    }
  }
  console.log('📈 Seeded realistic job applications');

  console.log('\n=================================================');
  console.log('🚀 SEED SUCCESSFUL - NEW STARTUP ECOSYSTEM READY!');
  console.log('=================================================');
  console.log('Main Admin: admin@hireverse.demo / Admin@123');
  console.log('Primary Demo Candidate: thiru.demo@hireverse.com / Demo@123');
  console.log(`Startups (25): email from templates / Startup@123`);
  console.log('=================================================');

  mongoose.connection.close();
};

seed().catch(err => {
  console.error('❌ Seeding failed: ', err);
  process.exit(1);
});
