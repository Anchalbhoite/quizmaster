import express from "express";
import Result from "../models/Result.js";


import { verifyToken } from "../middleware/authMiddleware.js";
import { saveResult } from "../controller/resultController.js";

const router = express.Router();

// Save a result
router.post("/", verifyToken, saveResult,async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.status(201).json({ message: "Result saved successfully", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get leaderboard — top 10 results sorted by score
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Result.find()
      .sort({ score: -1, timeSpent: 1 }) // Highest score first, then shortest time
      .limit(10);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get results for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.userId });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
