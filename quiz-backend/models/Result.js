import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  quizId: { type: Number, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Result", resultSchema);
