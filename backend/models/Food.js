const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    default: "Cold Coffee",
  },
  available: {
    type: Boolean,
    default: true,
  },
  sizes: {
    type: [
      {
        size: { type: String, enum: ["Single", "Half", "Full"] },
        price: { type: Number }
      }
    ],
    default: []
  }
});

module.exports = mongoose.model(
  "Food",
  foodSchema
);