const Review = require("../models/Review");

const addReview = async (req, res) => {
  try {
    const { foodName, rating, comment } = req.body;

    const review = new Review({
      userId: req.user.id,
      customerName: req.user.name,
      foodName,
      rating: Number(rating) || 5,
      comment,
      createdAt: new Date(),
    });

    await review.save();

    res.status(201).json({
      message: "Review Added Successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addReview,
  getReviews,
};
