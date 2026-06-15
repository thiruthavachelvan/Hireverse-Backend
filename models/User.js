const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  from: { type: String, default: '' },
  to: { type: String, default: null }, // null = current
  description: { type: String, default: '' },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  college: { type: String, default: '' },
  cgpa: { type: String, default: '' },
  certifications: { type: [String], default: [] },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  accountType: {
    type: String,
    required: true,
    enum: ['professional', 'company', 'admin'],
    default: 'professional',
  },
  profileImage: { type: String, default: '' },
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] },

  // Professional-specific fields
  employmentStatus: {
    type: String,
    enum: ['employed', 'unemployed', 'recently_left'],
    default: 'unemployed',
  },
  workExperience: { type: [workExperienceSchema], default: [] },
  education: { type: educationSchema, default: {} },
  resume: {
    name: { type: String, default: '' },
    data: { type: String, default: '' }, // Base64 PDF data
    contentType: { type: String, default: '' },
  },

  // Company-specific fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  companyDetails: {
    website: { type: String, default: '' },
    industry: { type: String, default: '' },
    size: { type: String, default: '' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    upcomingHiring: { type: String, default: '' },
  },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
