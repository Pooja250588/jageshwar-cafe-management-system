const express = require("express");
const router = express.Router();
const { addReview, getReviews } = require("../controllers/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", getReviews);
router.post("/", authMiddleware, addReview);

module.exports = router;
