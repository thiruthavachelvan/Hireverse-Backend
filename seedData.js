const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hireverse';

// Logo paths — generated images served as static or dicebear fallback
const LOGO_URLS = {
  'All India Translink': 'https://api.dicebear.com/7.x/shapes/svg?seed=AIT&backgroundColor=1a3a5c&rotate=0',
  'KumaranCorp': 'https://api.dicebear.com/7.x/shapes/svg?seed=KCC&backgroundColor=4a1a7a',
  'Hireverse': 'https://api.dicebear.com/7.x/shapes/svg?seed=Hireverse&backgroundColor=5b21b6',
  'KBT Limited': 'https://api.dicebear.com/7.x/shapes/svg?seed=KBT&backgroundColor=7f1d1d',
  'Haventree': 'https://api.dicebear.com/7.x/shapes/svg?seed=Haventree&backgroundColor=14532d',
  'Lacros': 'https://api.dicebear.com/7.x/shapes/svg?seed=Lacros&backgroundColor=0e7490',
  'Starc Industries': 'https://api.dicebear.com/7.x/shapes/svg?seed=Starc&backgroundColor=1e3a5f',
  'Wayne Enterprises': 'https://api.dicebear.com/7.x/shapes/svg?seed=Wayne&backgroundColor=1a1a1a',
  'Sabeer Technologies': 'https://api.dicebear.com/7.x/shapes/svg?seed=SabeerTech&backgroundColor=0c4a6e',
  'NovaTech Solutions': 'https://api.dicebear.com/7.x/shapes/svg?seed=NovaTech&backgroundColor=312e81',
};

const hashPwd = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
};

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to DB');

  // Wipe everything
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Wiped all collections');

  // ── 1. Admin ────────────────────────────────────────────────────────────────
  const adminPwd = await hashPwd('12345');
  const admin = await User.create({
    name: 'Main Admin',
    email: 'admin@123',
    password: adminPwd,
    accountType: 'admin',
    profileImage: 'https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=4c1d95',
  });
  console.log('👤 Admin created');

  // ── 2. Companies ────────────────────────────────────────────────────────────
  const companiesData = [
    {
      name: 'All India Translink',
      email: 'ait@company.com',
      bio: 'India\'s leading logistics and transport network, connecting every corner of the nation with speed and reliability.',
      companyDetails: { website: 'https://ait.in', industry: 'Logistics & Transport', size: '5000+', description: 'Pan-India freight and logistics solutions since 1987.' },
    },
    {
      name: 'KumaranCorp',
      email: 'kcc@company.com',
      bio: 'Premier IT consulting firm delivering enterprise-grade digital transformation and cloud solutions.',
      companyDetails: { website: 'https://kumarancorp.com', industry: 'IT Consulting', size: '500-1000', description: 'End-to-end IT consulting, from strategy to implementation.' },
    },
    {
      name: 'Hireverse',
      email: 'hireverse@company.com',
      bio: 'The creator company behind the HireVerse platform. We build the future of professional networking and hiring.',
      companyDetails: { website: 'https://hireverse.app', industry: 'HR Technology', size: '50-200', description: 'Building smarter hiring pipelines for modern companies.' },
    },
    {
      name: 'KBT Limited',
      email: 'kbt@company.com',
      bio: 'Precision manufacturing and industrial solutions for automotive, aerospace and heavy equipment sectors.',
      companyDetails: { website: 'https://kbtlimited.com', industry: 'Manufacturing', size: '1000-5000', description: 'Trusted partner for industrial and precision manufacturing.' },
    },
    {
      name: 'Haventree',
      email: 'haventree@company.com',
      bio: 'Crafting premium living spaces and commercial real estate across India\'s fastest-growing cities.',
      companyDetails: { website: 'https://haventree.in', industry: 'Real Estate', size: '200-500', description: 'From affordable homes to luxury developments.' },
    },
    {
      name: 'Lacros',
      email: 'lacros@company.com',
      bio: 'Fast-growing e-commerce platform specializing in lifestyle, fashion and electronics with next-day delivery.',
      companyDetails: { website: 'https://lacros.com', industry: 'E-Commerce', size: '500-1000', description: 'Shop smarter. Deliver faster. Live better.' },
    },
    {
      name: 'Starc Industries',
      email: 'starc@company.com',
      bio: 'Engineering excellence in structural design, civil infrastructure and large-scale industrial projects.',
      companyDetails: { website: 'https://starcindustries.com', industry: 'Engineering', size: '1000-5000', description: 'Building India\'s infrastructure for tomorrow.' },
    },
    {
      name: 'Wayne Enterprises',
      email: 'wayne@company.com',
      bio: 'A diversified global conglomerate with interests in defence, research, finance and advanced technology.',
      companyDetails: { website: 'https://wayneenterprises.com', industry: 'Conglomerate', size: '50000+', description: 'Powering the world through innovation and capital.' },
    },
    {
      name: 'Sabeer Technologies',
      email: 'sabeer@company.com',
      bio: 'Cutting-edge software products and SaaS platforms built for scalability, security and real-world impact.',
      companyDetails: { website: 'https://sabeertech.com', industry: 'Software', size: '200-500', description: 'Product-first software company focused on developer tools and enterprise SaaS.' },
    },
    {
      name: 'NovaTech Solutions',
      email: 'novatech@company.com',
      bio: 'Pioneering AI, machine learning and big data analytics to help businesses make smarter decisions faster.',
      companyDetails: { website: 'https://novatechsolutions.ai', industry: 'AI & Data', size: '100-500', description: 'AI-first company building intelligent automation pipelines.' },
    },
  ];

  const companyPwd = await hashPwd('company123');
  const companies = [];
  for (const c of companiesData) {
    const company = await User.create({
      name: c.name,
      email: c.email,
      password: companyPwd,
      accountType: 'company',
      bio: c.bio,
      verificationStatus: 'verified',
      profileImage: LOGO_URLS[c.name] || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=4c1d95`,
      companyDetails: c.companyDetails,
    });
    companies.push(company);
  }
  console.log(`🏢 ${companies.length} companies created`);

  // Company map for easy lookup
  const companyMap = {};
  companies.forEach(c => { companyMap[c.name] = c; });

  // ── 3. Candidates ───────────────────────────────────────────────────────────
  const candidatesData = [
    {
      name: 'Tushar KB',
      email: 'tushar@pro.com',
      headline: 'Software Engineer @ KBT Limited',
      bio: 'Passionate about building scalable systems. Currently working on embedded firmware at KBT Limited.',
      employmentStatus: 'employed',
      skills: ['C++', 'Embedded Systems', 'Python', 'RTOS', 'Git'],
      workExperience: [{ company: 'KBT Limited', role: 'Software Engineer', from: '2023-01', to: null, description: 'Working on firmware for industrial control systems.' }],
      education: { college: 'PSG College of Technology', cgpa: '8.4', certifications: ['AWS Certified Developer', 'Embedded Systems Professional'] },
    },
    {
      name: 'Thiruthavachelvan K',
      email: 'thiru@pro.com',
      headline: 'Frontend Developer | Open to Opportunities',
      bio: 'Unemployed and actively looking for frontend roles. Skilled in React, Next.js and modern web technologies.',
      employmentStatus: 'unemployed',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Figma'],
      workExperience: [{ company: 'Lacros', role: 'Frontend Intern', from: '2022-06', to: '2022-12', description: 'Built product listing and checkout UI components.' }],
      education: { college: 'Sri Krishna College of Engineering', cgpa: '7.9', certifications: ['Meta React Developer', 'Google UX Design'] },
    },
    {
      name: 'Vairavan T',
      email: 'vairavan@pro.com',
      headline: 'Data Analyst @ Sabeer Technologies',
      bio: 'Turning raw data into business intelligence. Specialized in Python data pipelines and Tableau dashboards.',
      employmentStatus: 'employed',
      skills: ['Python', 'Pandas', 'SQL', 'Tableau', 'Power BI', 'Machine Learning'],
      workExperience: [{ company: 'Sabeer Technologies', role: 'Data Analyst', from: '2022-08', to: null, description: 'Building ETL pipelines and BI dashboards for enterprise clients.' }],
      education: { college: 'NIT Trichy', cgpa: '9.1', certifications: ['Google Data Analytics', 'Databricks Certified Associate'] },
    },
    {
      name: 'Pranav S',
      email: 'pranav@pro.com',
      headline: 'Backend Developer | Recently left Haventree | Open to Work',
      bio: 'Experienced backend developer who recently left Haventree after 2 years. Looking for my next challenge in a product company.',
      employmentStatus: 'recently_left',
      skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'Kubernetes'],
      workExperience: [
        { company: 'Haventree', role: 'Backend Developer', from: '2022-03', to: '2024-03', description: 'Built microservices for property listing and booking systems.' },
        { company: 'Lacros', role: 'Backend Intern', from: '2021-06', to: '2021-12', description: 'Worked on order management APIs.' },
      ],
      education: { college: 'College of Engineering Guindy', cgpa: '8.7', certifications: ['MongoDB Associate Developer', 'CKA Kubernetes'] },
    },
    {
      name: 'Sujit Surya',
      email: 'sujit@pro.com',
      headline: 'Fresh Graduate | Aspiring Full Stack Developer',
      bio: 'Recent CS graduate from Anna University. Eager to start my career in web development. Built several personal projects.',
      employmentStatus: 'unemployed',
      skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'Python'],
      workExperience: [],
      education: { college: 'Anna University', cgpa: '8.2', certifications: ['freeCodeCamp Full Stack', 'HackerRank Problem Solving Gold'] },
    },
    {
      name: 'Aslam',
      email: 'aslam@pro.com',
      headline: 'Digital Marketing Lead | Ex-Wayne Enterprises | Exploring Opportunities',
      bio: 'Recently parted ways with Wayne Enterprises after 3 years as a digital marketing lead. Open to growth marketing and brand strategy roles.',
      employmentStatus: 'recently_left',
      skills: ['SEO', 'Content Strategy', 'Google Ads', 'Meta Ads', 'Analytics', 'Brand Building'],
      workExperience: [
        { company: 'Wayne Enterprises', role: 'Digital Marketing Lead', from: '2021-01', to: '2024-01', description: 'Led global digital campaigns with $2M+ annual budget.' },
        { company: 'Lacros', role: 'Marketing Executive', from: '2019-06', to: '2021-01', description: 'Managed e-commerce marketing and influencer partnerships.' },
      ],
      education: { college: 'Loyola College Chennai', cgpa: '7.5', certifications: ['Google Ads Certified', 'HubSpot Content Marketing', 'Meta Blueprint'] },
    },
    {
      name: 'Sabeer',
      email: 'sabeer@pro.com',
      headline: 'DevOps Engineer @ Haventree',
      bio: 'Infrastructure automation enthusiast. Managing cloud pipelines and CI/CD workflows at Haventree\'s tech division.',
      employmentStatus: 'employed',
      skills: ['AWS', 'Terraform', 'Ansible', 'Jenkins', 'Docker', 'Kubernetes', 'Linux'],
      workExperience: [{ company: 'Haventree', role: 'DevOps Engineer', from: '2023-03', to: null, description: 'Managing AWS infrastructure and building zero-downtime deployment pipelines.' }],
      education: { college: 'SRM Institute of Science and Technology', cgpa: '8.0', certifications: ['AWS Solutions Architect', 'HashiCorp Terraform Associate'] },
    },
    {
      name: 'Adnan',
      email: 'adnan@pro.com',
      headline: 'UI/UX Designer | Currently Freelancing | Open to Full-Time',
      bio: 'Product designer with a passion for human-centered design. Currently freelancing while looking for a full-time design role.',
      employmentStatus: 'unemployed',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Design Systems', 'Framer'],
      workExperience: [
        { company: 'Sabeer Technologies', role: 'UI/UX Intern', from: '2022-06', to: '2022-12', description: 'Designed onboarding flows and component libraries for SaaS products.' },
      ],
      education: { college: 'Sathyabama University', cgpa: '7.8', certifications: ['Google UX Design Professional', 'Figma Advanced'] },
    },
    {
      name: 'Koushik',
      email: 'koushik@pro.com',
      headline: 'Full Stack Developer @ NovaTech Solutions',
      bio: 'Building AI-powered web applications at NovaTech. Specializing in React frontends with Python/FastAPI backends.',
      employmentStatus: 'employed',
      skills: ['React', 'Python', 'FastAPI', 'PostgreSQL', 'TensorFlow', 'LangChain', 'Docker'],
      workExperience: [
        { company: 'NovaTech Solutions', role: 'Full Stack Developer', from: '2023-06', to: null, description: 'Building LLM-powered analytics dashboards.' },
        { company: 'KumaranCorp', role: 'Junior Developer', from: '2022-01', to: '2023-06', description: 'Developed client portals for consulting projects.' },
      ],
      education: { college: 'VIT Vellore', cgpa: '9.3', certifications: ['TensorFlow Developer Certificate', 'FastAPI Expert'] },
    },
    {
      name: 'Aravind',
      email: 'aravind@pro.com',
      headline: 'Product Manager @ All India Translink',
      bio: 'Driving product strategy for AIT\'s digital logistics suite. Bridging business goals with engineering execution.',
      employmentStatus: 'employed',
      skills: ['Product Strategy', 'Agile', 'Scrum', 'JIRA', 'Roadmapping', 'Data Analysis', 'Stakeholder Management'],
      workExperience: [
        { company: 'All India Translink', role: 'Product Manager', from: '2022-09', to: null, description: 'Leading the mobile app and driver management platform.' },
        { company: 'Starc Industries', role: 'Business Analyst', from: '2020-06', to: '2022-09', description: 'Analyzed operational data to improve project delivery timelines.' },
      ],
      education: { college: 'IIM Kozhikode', cgpa: '8.9', certifications: ['Certified Scrum Product Owner', 'Google Project Management'] },
    },
  ];

  const profPwd = await hashPwd('pro123');
  const candidates = [];
  for (const c of candidatesData) {
    const candidate = await User.create({
      name: c.name,
      email: c.email,
      password: profPwd,
      accountType: 'professional',
      headline: c.headline,
      bio: c.bio,
      employmentStatus: c.employmentStatus,
      skills: c.skills,
      workExperience: c.workExperience,
      education: c.education,
      profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=transparent`,
    });
    candidates.push(candidate);
  }
  console.log(`👥 ${candidates.length} candidates created`);

  // ── 4. Posts ────────────────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const allPosts = [
    // Company posts
    { userId: companyMap['All India Translink']._id, content: '🚚 AIT has successfully onboarded 200 new fleet vehicles this quarter, expanding coverage to 8 new districts in Tamil Nadu and Kerala. Our commitment to last-mile delivery grows stronger every day. #Logistics #Growth', createdAt: daysAgo(1) },
    { userId: companyMap['All India Translink']._id, content: '📦 We are hiring! AIT is looking for Logistics Operations Managers, Fleet Supervisors, and Data Analysts for our new digital ops center in Chennai. Follow our page and watch this space for job postings!', createdAt: daysAgo(5) },
    { userId: companyMap['KumaranCorp']._id, content: '🎉 KumaranCorp has been awarded the "Best IT Consulting Partner of the Year" award at the India Digital Summit 2026. Proud of our 800+ strong team for making this happen. #ITConsulting #Award', createdAt: daysAgo(2) },
    { userId: companyMap['KumaranCorp']._id, content: '☁️ We are expanding our Cloud Practice team. If you are a seasoned AWS/Azure architect or a DevOps engineer looking for your next challenge, we would love to talk. Exciting projects with Fortune 500 clients await!', createdAt: daysAgo(8) },
    { userId: companyMap['Hireverse']._id, content: '🚀 HireVerse 2.0 is here! We have completely rebuilt the hiring pipeline with AI-powered candidate matching, real-time interview scheduling, and a brand new company verification system. Experience smarter hiring. #HRTech #Product', createdAt: daysAgo(1) },
    { userId: companyMap['Hireverse']._id, content: '💡 Tip for companies: Did you know that verified companies on HireVerse get 3x more qualified applications? Apply for verification through your dashboard today!', createdAt: daysAgo(4) },
    { userId: companyMap['KBT Limited']._id, content: '🏭 KBT Limited has crossed ₹500 Crore in revenue for FY 2025-26. This milestone is a testament to our world-class manufacturing standards and dedicated workforce. Thank you to all our employees and partners!', createdAt: daysAgo(3) },
    { userId: companyMap['Haventree']._id, content: '🏠 Launching "HavenNest Phase III" — 240 premium 2 & 3 BHK apartments in Porur, Chennai. Possession by December 2027. Early bird pricing available. #RealEstate #Chennai', createdAt: daysAgo(2) },
    { userId: companyMap['Lacros']._id, content: '🛒 Lacros just crossed 10 MILLION orders! We started 3 years ago with 50 employees and a dream. Today we are 900+ strong and growing. To every customer who trusted us — THANK YOU! 🙏 #Ecommerce #Milestone', createdAt: daysAgo(1) },
    { userId: companyMap['Starc Industries']._id, content: '🏗️ Work begins on the Starc-led Coimbatore Outer Ring Road infrastructure project — a 142km expressway expected to transform connectivity in the region. Proud to be part of building India\'s future! #Infrastructure', createdAt: daysAgo(4) },
    { userId: companyMap['Wayne Enterprises']._id, content: '🌍 Wayne Enterprises is committing $500M over the next 5 years toward sustainable technology and clean energy initiatives in Asia. Because the future belongs to those who build it responsibly. #Sustainability', createdAt: daysAgo(2) },
    { userId: companyMap['Sabeer Technologies']._id, content: '💻 Sabeer Technologies is open-sourcing our internal developer toolkit "SaberKit" — a collection of Node.js utilities, React hooks and testing helpers that have powered our SaaS products. Star us on GitHub! #OpenSource', createdAt: daysAgo(3) },
    { userId: companyMap['NovaTech Solutions']._id, content: '🤖 Excited to announce NovaTech\'s latest LLM-powered product: "DataPilot" — an AI assistant for business analysts that translates plain English questions into SQL queries in real time. Sign up for early access!', createdAt: daysAgo(1) },

    // Candidate posts
    { userId: candidates.find(c=>c.name==='Tushar KB')._id, content: '🔧 Just finished debugging a nasty race condition in our RTOS firmware that was causing intermittent sensor failures. 4 hours of logic analyzer traces, 2 coffees, and one eureka moment later — fixed! Embedded dev life. 😄 #Embedded #C++', createdAt: daysAgo(2) },
    { userId: candidates.find(c=>c.name==='Thiruthavachelvan K')._id, content: '🎯 Day 47 of job hunting. I have applied to 60+ companies. Got 3 interviews. Learning a lot about what skills the market actually wants. Currently doubling down on TypeScript and Next.js. If you are hiring a frontend dev, let\'s talk! #OpenToWork #React', createdAt: daysAgo(1) },
    { userId: candidates.find(c=>c.name==='Vairavan T')._id, content: '📊 Just shipped a new real-time analytics dashboard at work that reduced our reporting cycle from weekly to live. Built with Python, Kafka, and Tableau. The look on the business team\'s faces was priceless 😄 #DataAnalytics #Python', createdAt: daysAgo(3) },
    { userId: candidates.find(c=>c.name==='Pranav S')._id, content: '👋 Official update: I have left Haventree after an incredible 2 years. Grateful for the experience, the team, and the growth. Now taking a short break before diving back in. Open to backend (Node.js/Go) opportunities. DMs open! #OpenToWork', createdAt: daysAgo(5) },
    { userId: candidates.find(c=>c.name==='Sujit Surya')._id, content: '🚀 Just deployed my first full-stack project — a task management app with auth, real-time updates using Socket.io, and drag-and-drop boards. Built it solo in 3 weeks. Check it out on GitHub! Feedback welcome 🙏 #FirstProject #FullStack', createdAt: daysAgo(4) },
    { userId: candidates.find(c=>c.name==='Aslam')._id, content: '📣 After 3 amazing years leading digital marketing at Wayne Enterprises, I have decided to move on and explore what is next. Looking for growth marketing or brand strategy roles at product-led companies. Let\'s connect! #Marketing #OpenToWork', createdAt: daysAgo(6) },
    { userId: candidates.find(c=>c.name==='Sabeer')._id, content: '⚙️ Just migrated our entire infrastructure from manually managed EC2 instances to a fully Terraform-managed setup with auto-scaling groups. Zero downtime migration. One of the most satisfying things I have done at work. #DevOps #Terraform #AWS', createdAt: daysAgo(2) },
    { userId: candidates.find(c=>c.name==='Adnan')._id, content: '🎨 Just wrapped up a freelance project — a complete redesign of a food delivery app. Went from 0 to full prototype in Figma in 10 days. Happy with the outcome! Open to full-time design roles. #UXDesign #Figma #OpenToWork', createdAt: daysAgo(3) },
    { userId: candidates.find(c=>c.name==='Koushik')._id, content: '🤖 We just shipped "DataPilot" at NovaTech — an AI that turns plain English into SQL. I worked on the React frontend and LangChain integration. It is genuinely magical to see non-technical users query databases with natural language. #AI #FullStack', createdAt: daysAgo(1) },
    { userId: candidates.find(c=>c.name==='Aravind')._id, content: '📱 Big week at AIT — launched our new Driver Companion App to 2000+ fleet drivers across India. 4.7★ rating on day one. Months of user research, sprint reviews, and stakeholder alignment finally paying off. Proud PM moment! #ProductManagement', createdAt: daysAgo(2) },
  ];

  for (const p of allPosts) {
    await Post.create({ userId: p.userId, content: p.content, likes: [], comments: [], createdAt: p.createdAt });
  }
  console.log(`📝 ${allPosts.length} posts created`);

  console.log('\n✅ SEED COMPLETE!');
  console.log('─────────────────────────────────────');
  console.log('Admin:     admin@123 / 12345');
  console.log('Companies: [email] / company123');
  console.log('Candidates:[email] / pro123');
  console.log('─────────────────────────────────────');

  mongoose.connection.close();
};

seed().catch(err => { console.error(err); process.exit(1); });
