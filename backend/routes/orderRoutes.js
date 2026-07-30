const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Protected routes (require user login)
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.put("/:id/cancel", authMiddleware, cancelOrder);

// Admin-only route
router.put("/:id", authMiddleware, adminOnly, updateOrderStatus);

module.exports = router;