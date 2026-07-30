const Razorpay = require("razorpay");
const crypto = require("crypto");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "mockSecretKey1234567890";

let razorpayInstance = null;

// Initialize Razorpay only if keys are not mock
if (RAZORPAY_KEY_ID !== "rzp_test_mockKeyId123") {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error("Razorpay initialization error:", err);
  }
}

const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount specified" });
    }

    const amountInPaise = Math.round(amount * 100);

    // Mock Mode fallback
    if (!razorpayInstance) {
      const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9)}`;
      return res.json({
        id: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        mockMode: true,
        key_id: RAZORPAY_KEY_ID
      });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({
      ...order,
      key_id: RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ message: error.message || "Failed to create payment order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing verification credentials" });
    }

    // Mock verification fallback
    if (razorpayOrderId.startsWith("order_mock_")) {
      return res.json({ verified: true, message: "Payment verified successfully (Mock Mode)" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature === razorpaySignature) {
      res.json({ verified: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ verified: false, message: "Payment signature verification failed" });
    }
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment
};
