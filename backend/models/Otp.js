const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "register"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 }, // Expire document after 5 minutes (300 seconds)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
