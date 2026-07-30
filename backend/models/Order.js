const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: String,
  customerName: String,
  phone: String,
  address: String,

  items: Array,

  totalAmount: Number,

  status: {
    type: String,
    default: "Pending"
  },

  paymentMethod: {
    type: String,
    default: "COD"
  },

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  razorpayOrderId: {
    type: String
  },

  razorpayPaymentId: {
    type: String
  },

  razorpaySignature: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);