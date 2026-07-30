const mongoose = require("mongoose");
require("dotenv").config();
const Food = require("./models/Food");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/jageshwar-cafe";

const newMenuItems = [
  // ── LUNCH ───────────────────────────────────────────────────
  {
    name: "Standard Lunch Thali | स्टैंडर्ड लंच थाली",
    price: 89,
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
    available: true,
  },
  {
    name: "Paneer Butter Masala | पनीर बटर मसाला",
    price: 40,
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
    available: true,
    sizes: [
      { size: "Single", price: 40 },
      { size: "Half", price: 70 },
      { size: "Full", price: 120 }
    ]
  },
  {
    name: "Sev Tamatar | सेव टमाटर",
    price: 30,
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500",
    available: true,
    sizes: [
      { size: "Single", price: 30 },
      { size: "Half", price: 50 },
      { size: "Full", price: 80 }
    ]
  },

  // ── DINNER ──────────────────────────────────────────────────
  {
    name: "Standard Dinner Thali | स्टैंडर्ड डिनर थाली",
    price: 119,
    category: "Dinner",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
    available: true,
  },
  {
    name: "Mix Veg Curry | मिक्स वेज करी",
    price: 35,
    category: "Dinner",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    available: true,
    sizes: [
      { size: "Single", price: 35 },
      { size: "Half", price: 60 },
      { size: "Full", price: 100 }
    ]
  }
];

async function seedMenu() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of newMenuItems) {
      const exists = await Food.findOne({ name: item.name });
      if (!exists) {
        await Food.create(item);
        console.log(`✅ Added: ${item.name} (₹${item.price})`);
        addedCount++;
      } else {
        console.log(`ℹ️ Skipped (already exists): ${item.name}`);
        skippedCount++;
      }
    }

    console.log("\nSeeding Completed!");
    console.log(`Total Added: ${addedCount}`);
    console.log(`Total Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedMenu();
