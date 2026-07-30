const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

// Create a new support ticket
const createTicket = async (req, res) => {
  try {
    const { category, orderId, subject, description } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ message: "Category, subject, and description are required" });
    }

    // Fetch user details for ticket pre-fill
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ticket = new SupportTicket({
      userId: req.user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      category,
      orderId: orderId || null,
      subject,
      description,
      status: "Open",
      messages: [
        {
          sender: "user",
          message: description,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ticket.save();

    // Notify all admins via Socket.io
    const io = req.app.locals.io;
    if (io) {
      io.to("admin").emit("new-ticket", {
        ticket,
        customerName: ticket.name,
        category: ticket.category,
        subject: ticket.subject,
      });
    }

    res.status(201).json({
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tickets (for admin) or user-specific tickets (for customer)
const getTickets = async (req, res) => {
  try {
    let tickets;
    if (req.user.role === "admin") {
      tickets = await SupportTicket.find().sort({ updatedAt: -1 });
    } else {
      tickets = await SupportTicket.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    }
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single support ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check permissions: admin or owner only
    if (req.user.role !== "admin" && ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a reply / add a message to ticket
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check permissions
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sender = isAdmin ? "admin" : "user";
    
    // Add new message
    ticket.messages.push({
      sender,
      message,
      createdAt: new Date(),
    });

    // Update status based on sender
    if (isAdmin) {
      // If admin replies, status moves to In Progress if it was Open
      if (ticket.status === "Open") {
        ticket.status = "In Progress";
      }
    } else {
      // If customer replies, set status back to Open (re-opens if Resolved or alerts admin)
      ticket.status = "Open";
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const io = req.app.locals.io;
    if (io) {
      // Notify user
      io.to(`user-${ticket.userId.toString()}`).emit("ticket-update", {
        ticketId: ticket._id,
        ticket,
        status: ticket.status,
        sender,
        latestMessage: message,
      });

      // Notify admin
      io.to("admin").emit("ticket-update", {
        ticketId: ticket._id,
        ticket,
        status: ticket.status,
        sender,
        latestMessage: message,
      });
    }

    res.json({
      message: "Message added successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (Admin only)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Open", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const io = req.app.locals.io;
    if (io) {
      // Notify user about status change
      io.to(`user-${ticket.userId.toString()}`).emit("ticket-status-change", {
        ticketId: ticket._id,
        status,
        subject: ticket.subject,
      });

      // Notify admin
      io.to("admin").emit("ticket-status-change", {
        ticketId: ticket._id,
        status,
        subject: ticket.subject,
      });
    }

    res.json({
      message: `Ticket status updated to ${status}`,
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
};
