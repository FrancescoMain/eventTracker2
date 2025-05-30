const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events"); // Import event routes
const path = require("path");

const app = express();

// Middleware
app.use(express.json()); // To parse JSON bodies

// Connect to MongoDB (replace with your connection string)
// For local MongoDB: 'mongodb://localhost:27017/yourdbname'
// For MongoDB Atlas: Get your connection string from your Atlas dashboard
const MONGO_URI = "mongodb://localhost:27017/calendarApp"; // Replace if needed

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes); // Use event routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
