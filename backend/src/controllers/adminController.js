// backend/src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');

// ✅ Initialize Twilio SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 🩸 Get all hospitals (Admin Dashboard)
exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 🏥 Create new hospital (directly verified by admin)
exports.createHospital = async (req, res) => {
  try {
    let { name, email, address, location } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name and email are required.',
      });
    }

    // 📍 Normalize location if it's a string like "lat,lng"
    if (typeof location === 'string' && location.trim()) {
      const parts = location.split(',').map((v) => Number(v.trim()));
      if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) {
        location = { lat: parts[0], lng: parts[1] };
      } else {
        location = undefined;
      }
    }

    if (location && (typeof location.lat !== 'number' || typeof location.lng !== 'number')) {
      location = undefined;
    }

    // 🧩 Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    // 🔑 Generate random password
    const password = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 Create hospital user (auto verified)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'hospital',
      isVerified: true,
      pendingApproval: false,
      location,
    });

    // 🏥 Create hospital record (directly verified)
    const hospital = await Hospital.create({
      owner: user._id,
      name,
      address,
      location,
      verified: true,
    });

    // 📧 Compose SendGrid email (spam-safe version)
    const msg = {
      to: { email, name },
      from: { email: process.env.EMAIL_FROM, name: 'Blood Donation' }, // friendly display name
      replyTo: process.env.EMAIL_FROM,
      subject: 'Your Hospital Account is Ready',
      text: `Hi ${name},

Your hospital account has been created successfully.

Login Email: ${email}
Temporary Password: ${password}

Please sign in and change your password immediately.

— Blood Donation Team`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
          <h2 style="color:#c00;">Welcome to Blood Donation Platform</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your hospital account has been successfully created by the admin.</p>
          <p><strong>Login Credentials:</strong></p>
          <ul>
            <li><b>Email:</b> ${email}</li>
            <li><b>Password:</b> ${password}</li>
          </ul>
          <p>Please sign in and change your password immediately for your security.</p>
          <a href="https://your-frontend-login-url.com" 
             style="display:inline-block;margin-top:12px;padding:10px 16px;
                    background-color:#c00;color:#fff;text-decoration:none;
                    border-radius:6px;font-weight:600;">
            Login Now
          </a>
          <p style="color:#777;margin-top:16px;font-size:0.9rem;">
            If you didn’t request this, please ignore this email or reply to let us know.
          </p>
          <p>— Blood Donation Team</p>
        </div>
      `,
      categories: ['transactional', 'hospital-onboarding'],
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
      mailSettings: {
        bypassListManagement: { enable: true }, // ensures it's treated as transactional
      },
    };

    // ✅ Send email via Twilio SendGrid
    let emailSent = false;
    let emailError = null;
    try {
      await sgMail.send(msg);
      console.log('📧 Email sent successfully via SendGrid');
      emailSent = true;
    } catch (err) {
      console.error('❌ Error sending email via SendGrid:', err.response ? err.response.body : err);
      emailError = err.message;
    }

    // 🎉 Send response
    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Hospital added successfully and credentials sent via email.'
        : 'Hospital added successfully, but email failed to send.',
      data: hospital,
      credentials: { email: user.email, password },
      email: { sent: emailSent, error: emailError },
    });
  } catch (error) {
    console.error('Error creating hospital:', error);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate email found.' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid hospital data.' });
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 🩸 Pending donors (not yet verified)
exports.pendingDonors = async (req, res) => {
  try {
    const donors = await User.find(
      { role: 'donor', isVerified: false },
      'name email bloodGroup phone createdAt pendingApproval isVerified'
    )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: donors.length, data: donors });
  } catch (error) {
    console.error('Error fetching pending donors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Approve/verify a donor
exports.patchDonor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { approve } = req.body || {};
    const update = approve === false
      ? { isVerified: false, pendingApproval: false }
      : { isVerified: true, pendingApproval: false };
    const updated = await User.findOneAndUpdate(
      { _id: userId, role: 'donor' },
      { $set: update },
      { new: true, projection: 'name email bloodGroup phone isVerified pendingApproval' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error verifying donor:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 🏥 Pending hospitals (not verified)
exports.pendingHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find(
      { verified: false },
      'name address location createdAt owner verified'
    )
      .populate('owner', 'name email pendingApproval isVerified')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    console.error('Error fetching pending hospitals:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 📊 Audit snapshot
exports.audit = async (req, res) => {
  try {
    const [totalUsers, donorsCount, hospitalsUsersCount, adminsCount, verifiedDonors, pendingDonors, totalHospitals, verifiedHospitals, totalDonations, pendingDonations, completedDonations, totalRequests, openRequests, fulfilledRequests] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'donor', isVerified: true }),
      User.countDocuments({ role: 'donor', isVerified: false }),
      Hospital.countDocuments({}),
      Hospital.countDocuments({ verified: true }),
      Donation.countDocuments({}),
      Donation.countDocuments({ status: 'pending' }),
      Donation.countDocuments({ status: 'completed' }),
      Request.countDocuments({}),
      Request.countDocuments({ status: 'open' }),
      Request.countDocuments({ status: 'fulfilled' }),
    ]);

    res.status(200).json({
      success: true,
      users: {
        total: totalUsers,
        byRole: { donors: donorsCount, hospitals: hospitalsUsersCount, admins: adminsCount },
        donors: { verified: verifiedDonors, pending: pendingDonors },
      },
      hospitals: { total: totalHospitals, verified: verifiedHospitals },
      donations: { total: totalDonations, pending: pendingDonations, completed: completedDonations },
      requests: { total: totalRequests, open: openRequests, fulfilled: fulfilledRequests },
    });
  } catch (error) {
    console.error('Error building audit snapshot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// � Combined overview reduces multiple round trips
exports.overview = async (req, res) => {
  try {
    const [auditSnapshot, donors, donations] = await Promise.all([
      (async () => {
        const [totalUsers, donorsCount, hospitalsUsersCount, adminsCount, verifiedDonors, pendingDonors, totalHospitals, verifiedHospitals, totalDonations, pendingDonations, completedDonations, totalRequests, openRequests, fulfilledRequests] = await Promise.all([
          User.countDocuments({}),
          User.countDocuments({ role: 'donor' }),
          User.countDocuments({ role: 'hospital' }),
          User.countDocuments({ role: 'admin' }),
          User.countDocuments({ role: 'donor', isVerified: true }),
          User.countDocuments({ role: 'donor', isVerified: false }),
          Hospital.countDocuments({}),
          Hospital.countDocuments({ verified: true }),
          Donation.countDocuments({}),
          Donation.countDocuments({ status: 'pending' }),
          Donation.countDocuments({ status: 'completed' }),
          Request.countDocuments({}),
          Request.countDocuments({ status: 'open' }),
          Request.countDocuments({ status: 'fulfilled' }),
        ]);
        return {
          success: true,
            users: {
              total: totalUsers,
              byRole: { donors: donorsCount, hospitals: hospitalsUsersCount, admins: adminsCount },
              donors: { verified: verifiedDonors, pending: pendingDonors },
            },
            hospitals: { total: totalHospitals, verified: verifiedHospitals },
            donations: { total: totalDonations, pending: pendingDonations, completed: completedDonations },
            requests: { total: totalRequests, open: openRequests, fulfilled: fulfilledRequests },
        };
      })(),
      User.find({ role: 'donor', isVerified: false }, 'name email bloodGroup phone createdAt pendingApproval isVerified').sort({ createdAt: -1 }).lean(),
      Donation.find({ status: 'pending' }, 'donor hospital hospitalName date units location status verified createdAt')
        .populate('donor', 'name email bloodGroup')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json({ success: true, audit: auditSnapshot, pendingDonors: donors, pendingDonations: donations });
  } catch (error) {
    console.error('Error building overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// �💉 Pending donations
exports.pendingDonations = async (req, res) => {
  try {
    const donations = await Donation.find(
      { status: 'pending' },
      'donor hospital hospitalName date units location status verified createdAt'
    )
      .populate('donor', 'name email bloodGroup')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    console.error('Error fetching pending donations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Verify/complete a donation
exports.verifyDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { verify } = req.body || {};
    const update = verify === false
      ? { verified: false, status: 'cancelled', verifiedBy: req.user.id, verifiedAt: new Date() }
      : { verified: true, status: 'completed', verifiedBy: req.user.id, verifiedAt: new Date() };
    const updated = await Donation.findOneAndUpdate(
      { _id: donationId },
      { $set: update },
      { new: true }
    )
      .populate('donor', 'name email bloodGroup')
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error verifying donation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
