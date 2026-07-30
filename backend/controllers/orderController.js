const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    const { 
      customerName, 
      phone, 
      address, 
      items, 
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const order = new Order({
      userId: req.user.id,
      customerName,
      phone,
      address,
      items,
      totalAmount,
      status: "Pending",
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "Pending",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      createdAt: new Date(),
    });

    await order.save();

    // ── Real-time: Notify all admins about the new order ──────
    const io = req.app.locals.io;
    if (io) {
      io.to("admin").emit("new-order", {
        order,
        customerName,
        totalAmount,
        itemCount: items.length,
      });
    }

    res.status(201).json({
      message: "Order Placed Successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    let orders;
    // If admin, retrieve all orders. If normal user, retrieve only their own.
    if (req.user.role === "admin") {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ── Real-time: Notify the specific customer about status update ──
    const io = req.app.locals.io;
    if (io) {
      io.to(`user-${order.userId}`).emit("order-status-update", {
        orderId: order._id,
        status,
        customerName: order.customerName,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order belongs to the authenticated user
    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to cancel this order" });
    }

    // Check if the order is still Pending
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Order cannot be cancelled as it is already accepted by the admin" });
    }

    // Update the order status to Cancelled
    order.status = "Cancelled";
    
    // If order was already paid, mark payment status as "Refund Pending"
    if (order.paymentStatus === "Paid") {
      order.paymentStatus = "Refund Pending";
    }

    await order.save();

    // ── Real-time: Notify all admins and user room ──
    const io = req.app.locals.io;
    if (io) {
      // Notify admin about the cancel event
      io.to("admin").emit("order-status-update", {
        orderId: order._id,
        status: "Cancelled",
        customerName: order.customerName,
        paymentStatus: order.paymentStatus,
      });

      // Notify the specific customer about status update
      io.to(`user-${order.userId}`).emit("order-status-update", {
        orderId: order._id,
        status: "Cancelled",
        customerName: order.customerName,
        paymentStatus: order.paymentStatus,
      });
    }

    res.json({
      message: "Order Cancelled Successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
};