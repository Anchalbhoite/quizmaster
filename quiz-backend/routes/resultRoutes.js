import express from "express";
import Result from "../models/Result.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


import { verifyToken } from "../middleware/authMiddleware.js";


const router = express.Router();
import { saveResult, getUserStats } from "../controller/resultController.js";

router.post("/", authMiddleware, saveResult);


// Save a result
// Save a result
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await Result.find({ userId });

    if (results.length === 0) {
      const totalUsersArray = await Result.distinct("userId");
const totalUsers = totalUsersArray.length;
      return res.json({
        quizzesCompleted: 0,
        averageScore: 0,
        globalRanking: totalUsers + 1 // put them at bottom
      });
    }

    const quizzesCompleted = results.length;
    const averageScore =
      results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) /
      results.length;

    // Aggregation for fair ranking by percentage
    const allResults = await Result.aggregate([
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] } }
        }
      }
    ]);

    const sorted = allResults.sort((a, b) => b.avgScore - a.avgScore);
    const rank = sorted.findIndex(r => r._id.toString() === userId.toString()) + 1;

    res.json({
      quizzesCompleted,
      averageScore: Math.round(averageScore),
      globalRanking: rank
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard — top 10 by percentage
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Result.aggregate([
      {
        $project: {
          userId: 1,
          percentage: { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] },
          timeSpent: 1
        }
      },
      { $sort: { percentage: -1, timeSpent: 1 } },
      { $limit: 10 }
    ]);

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
