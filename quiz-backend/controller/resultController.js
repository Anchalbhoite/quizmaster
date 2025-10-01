import Result from "../models/Result.js";


// Save quiz result
export const saveResult = async (req, res) => {
  try {
    const { quizId, score, totalQuestions, timeSpent, completedAt } = req.body;

    if (!quizId || score === undefined || totalQuestions === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = new Result({
      quizId,
      score,
      totalQuestions,
      timeSpent,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      userId: req.user ? req.user.id : null // Optional: if authentication
    });

    await result.save();
    res.status(201).json({ message: "Result saved successfully", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving result", error: err.message });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Result.find()
      .sort({ score: -1, timeSpent: 1 }) // Higher score first, then lower time
      .limit(10)
      .populate("userId", "name email"); // Optional: populate user info

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching leaderboard", error: err.message });
  }
};
