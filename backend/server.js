const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const supportRoutes = require("./routes/supportRoutes");

const User = require("./models/User");
const bcrypt = require("bcryptjs");

const app = express();
const server = http.createServer(app);

// ── Socket.IO Setup ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.locals.io = io;

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join-admin", () => {
    socket.join("admin");
    console.log(`👑 Admin joined: ${socket.id}`);
  });

  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Create Admin Only Once ──────────────────────────────────
const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin@123", 10);

      await User.create({
        name: "Jageshwar Admin",
        email: "admin@jageshwarcafe.com",
        phone: "9876543210",
        password: hashedPassword,
        role: "admin",
        village: "Jawra",
        address: "Near Post Office, Jawra, Betul",
      });

      console.log("✅ Default admin account created");
      console.log("Email: admin@jageshwarcafe.com");
      console.log("Password: admin@123");
    }
  } catch (error) {
    console.error("Admin seeding failed:", error);
  }
};

// ── MongoDB Connection ──────────────────────────────────────
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb://localhost:27017/jageshwar-cafe"
  )
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Create admin only if not exists
    await seedAdmin();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ── Routes ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Jageshwar Cafe Backend Running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/support", supportRoutes);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});