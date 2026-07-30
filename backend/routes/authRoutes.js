const express = require("express");

const router = express.Router();

const {
  registerOtp,
  registerUser,
  loginUser,
  checkEmail,
  checkPhone,
  loginOtp,
  loginOtpVerify,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/test", (req, res) => {
  res.json({
    message: "Auth Route Working",
  });
});

router.post("/register-otp", registerOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/check-email", checkEmail);
router.post("/check-phone", checkPhone);
router.post("/login-otp", loginOtp);
router.post("/login-otp-verify", loginOtpVerify);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;