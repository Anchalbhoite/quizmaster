import express from "express";
import Result from "../models/Result.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const results = await Result.find()
      .populate("userId", "name email") // populate userId with name and email
      .sort({ score: -1, timeSpent: 1 }) // highest score first
      .limit(10);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
