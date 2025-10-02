// controller/resultController.js
import Result from "../models/Result.js";

export const saveResult = async (req, res) => {
  try {
    const { quizId, score, totalQuestions, timeSpent } = req.body;

    const result = new Result({
      userId: req.user.id,  // ✅ coming from JWT middleware
      quizId,
      score,
      totalQuestions,
      timeSpent,
      completedAt: new Date()
    });

    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const results = await Result.find({ userId });

    const quizzesCompleted = results.length;
    const averageScore =
      results.length > 0
        ? Math.round(
            results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) /
              results.length
          )
        : 0;

    // for ranking: compare with all users
    const allResults = await Result.aggregate([
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: { $divide: ["$score", "$totalQuestions"] } },
          quizzesCompleted: { $sum: 1 }
        }
      }
    ]);

    const sorted = allResults.sort((a, b) => b.avgScore - a.avgScore);
    const rank = sorted.findIndex(r => r._id.toString() === userId.toString()) + 1;

    res.json({ quizzesCompleted, averageScore, rank });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
