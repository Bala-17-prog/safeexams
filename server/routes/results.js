// server/routes/results.js
const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Question = require("../models/Question"); // Import Question model

router.post("/submit", async (req, res) => {
  try {
    const { username, domain, answers, violationCount } = req.body;

    let score = 0;
    const totalQuestions = Object.keys(answers).length;

    // --- NEW GRADING LOGIC ---
    // 1. Fetch the actual questions to get the correct answers
    const questions = await Question.find({ _id: { $in: Object.keys(answers) } });

    // 2. Loop through and grade
    questions.forEach(q => {
      const studentAns = answers[q._id];

      if (q.type === 'mcq') {
        // Strict check for MCQs
        if (studentAns === q.correctAnswer) {
          score += 1; 
        }
      } else {
        // Loose check for others (Code/Fillups) -> Give points if not empty
        // (In a real app, you'd use AI here)
        if (studentAns && studentAns.length > 2) {
          score += 1;
        }
      }
    });

    const percentage = totalQuestions === 0 ? 0 : (score / totalQuestions) * 100;
    const status = percentage >= 50 ? "Pass" : "Fail";

    const newResult = new Result({
      username,
      domain,
      score: Math.round(percentage),
      totalQuestions,
      status,
      answers,
      violationCount
    });

    await newResult.save();

    res.status(201).json({ message: "Exam Submitted." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  const results = await Result.find().sort({ date: -1 });
  res.json(results);
});

module.exports = router;