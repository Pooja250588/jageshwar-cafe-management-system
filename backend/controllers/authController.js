const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpSms, getConfiguredProvider } = require("../services/smsService");

const JWT_SECRET = process.env.JWT_SECRET || "jageshwar_secret_key";

const registerOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian phone number." });
    }

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "This phone number is already registered. Please login instead." });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTPs for this number and purpose
    await Otp.deleteMany({ phone, purpose: "register" });

    // Save to DB
    const otpRecord = new Otp({
      phone,
      otp,
      purpose: "register",
    });
    await otpRecord.save();

    // Send SMS (real SMS if provider configured, otherwise console fallback)
    const smsResult = await sendOtpSms(phone, otp, "register");
    const provider = getConfiguredProvider();
    const isRealSms = provider !== null && smsResult.provider !== "console";

    res.status(200).json({
      message: isRealSms
        ? "OTP sent to your phone number via SMS"
        : "OTP sent successfully",
      otp: isRealSms ? undefined : otp,
      mockMode: !isRealSms,
      provider: smsResult.provider,
    });
  } catch (error) {
    console.error("Register OTP Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, village, address, otp } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Full name is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Please provide a valid 10-digit Indian phone number." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP verification code is required." });
    }

    // Validate OTP against database
    const otpRecord = await Otp.findOne({ phone, purpose: "register" });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not requested. Please try again." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP code. Please check and try again." });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    // Delete OTP record after successful validation
    await Otp.deleteMany({ phone, purpose: "register" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: role || "user",
      village: village || "Jawra",
      address: address || ""
    });

    await user.save();

    res.status(201).json({
      message: "User Registered Successfully"
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        village: user.village,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ available: !user });
  } catch (error) {
    console.error("Check Email error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid 10-digit Indian phone number format." });
    }
    const user = await User.findOne({ phone });
    res.json({ available: !user });
  } catch (error) {
    console.error("Check Phone error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const loginOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian phone number." });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "No account found with this phone number. Please register first." });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this number and purpose
    await Otp.deleteMany({ phone, purpose: "login" });

    // Save to DB
    const otpRecord = new Otp({
      phone,
      otp,
      purpose: "login",
    });
    await otpRecord.save();

    // Send SMS (real SMS if provider configured, otherwise console fallback)
    const smsResult = await sendOtpSms(phone, otp, "login");
    const provider = getConfiguredProvider();
    const isRealSms = provider !== null && smsResult.provider !== "console";

    res.json({
      message: isRealSms
        ? "OTP sent to your phone number via SMS"
        : "OTP sent successfully",
      otp: isRealSms ? undefined : otp,
      mockMode: !isRealSms,
      provider: smsResult.provider,
    });
  } catch (error) {
    console.error("Login OTP error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const loginOtpVerify = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!otp) {
      return res.status(400).json({ message: "OTP code is required" });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "No account found with this phone number." });
    }

    // Verify OTP against database
    const otpRecord = await Otp.findOne({ phone, purpose: "login" });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not requested. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP code. Please check and try again." });
    }

    // Delete OTP record after successful verification
    await Otp.deleteMany({ phone, purpose: "login" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        village: user.village,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Login OTP verify error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, village, address } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (village) user.village = village;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        village: user.village,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify Current Password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash & Save New Password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerOtp,
  registerUser,
  loginUser,
  checkEmail,
  checkPhone,
  loginOtp,
  loginOtpVerify,
  updateProfile,
  changePassword,
};
