const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
} = require("../controllers/supportController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Protected routes (require user login)
router.post("/", authMiddleware, createTicket);
router.get("/", authMiddleware, getTickets);
router.get("/:id", authMiddleware, getTicketById);
router.post("/:id/message", authMiddleware, addMessage);

// Admin-only route
router.put("/:id/status", authMiddleware, adminOnly, updateTicketStatus);

module.exports = router;
