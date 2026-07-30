const express = require("express");
const router = express.Router();
const {
  addFood,
  getFoods,
  updateFood,
  deleteFood,
    toggleAvailability,
} = require("../controllers/foodController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Public route to view menu
router.get("/", getFoods);

// Protected Admin-only routes
router.post("/", authMiddleware, adminOnly, addFood);
router.put("/:id", authMiddleware, adminOnly, updateFood);
router.delete("/:id", authMiddleware, adminOnly, deleteFood);
router.put(
  "/:id/availability",
  authMiddleware,
  adminOnly,
  toggleAvailability
);

module.exports = router;