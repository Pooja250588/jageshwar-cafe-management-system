const express = require("express");
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;
