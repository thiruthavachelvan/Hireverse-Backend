const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all companies with verification status
// @route   GET /api/admin/companies
// @access  Admin only
const getCompanies = async (req, res) => {
  try {
    const companies = await User.find({ accountType: 'company' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all professionals
// @route   GET /api/admin/professionals
// @access  Admin only
const getProfessionals = async (req, res) => {
  try {
    const professionals = await User.find({ accountType: 'professional' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(professionals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify or reject a company
// @route   PUT /api/admin/companies/:id/verify
// @access  Admin only
const verifyCompany = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    const companyId = req.params.id;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be verified, rejected, or pending' });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (company.accountType !== 'company') {
      return res.status(400).json({ message: 'User is not a company account' });
    }

    company.verificationStatus = status;
    await company.save();

    res.json({
      message: `Company ${status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'moved to pending'} successfully`,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        verificationStatus: company.verificationStatus,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Admin only
const getStats = async (req, res) => {
  try {
    const [totalCompanies, verifiedCompanies, pendingCompanies, totalProfessionals, totalJobs, totalApplications] =
      await Promise.all([
        User.countDocuments({ accountType: 'company' }),
        User.countDocuments({ accountType: 'company', verificationStatus: 'verified' }),
        User.countDocuments({ accountType: 'company', verificationStatus: 'pending' }),
        User.countDocuments({ accountType: 'professional' }),
        Job.countDocuments(),
        Application.countDocuments(),
      ]);

    res.json({
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      totalProfessionals,
      totalJobs,
      totalApplications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCompanies,
  getProfessionals,
  verifyCompany,
  getStats,
};
