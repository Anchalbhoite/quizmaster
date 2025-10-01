import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import leaderboardRoute from "./routes/leaderboardRoute.js";

dotenv.config();

const app = express();
// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.get("/", (req, res) => {
  res.send("✅ Quiz Backend is Running...");
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/leaderboard", leaderboardRoute);

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB connected");
  app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
})
.catch((err) => console.error("MongoDB connection error:", err));
