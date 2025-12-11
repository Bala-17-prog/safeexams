// server/routes/questions.js
const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const ExamState = require("../models/ExamState");
const Result = require("../models/Result"); // Import Result Model
const User = require("../models/User");     // Import User Model

// --- 1. ADD QUESTION ---
router.post("/add", async (req, res) => {
  try {
    const { 
      questionText, domain, session, 
      type, section, options, codeSnippet, 
      correctAnswer 
    } = req.body;
    
    const newQuestion = new Question({ 
      questionText, 
      domain: domain.trim(), 
      session: session || "1",
      type: type || 'descriptive',
      section: section || '3',
      options: options || [],
      codeSnippet: codeSnippet || "",
      correctAnswer: correctAnswer || ""
    });
    
    await newQuestion.save();
    res.status(201).json({ message: "Question Added Successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. ACTIVATE EXAM ---
router.post("/activate", async (req, res) => {
  try {
    const { domain, session, isActive } = req.body;
    const cleanDomain = domain.trim();

    let state = await ExamState.findOne({ domain: cleanDomain });
    if (!state) state = new ExamState({ domain: cleanDomain });

    state.activeSession = session;
    state.isActive = isActive;
    await state.save();

    res.json({ message: `Exam ${isActive ? "Started" : "Stopped"} for ${cleanDomain}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. STUDENT FETCH ---
router.get("/student-fetch", async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ message: "Domain required" });

    const cleanDomain = domain.trim();
    const state = await ExamState.findOne({ domain: cleanDomain });
    
    if (!state || !state.isActive) {
      return res.json({ active: false, message: "Exam inactive." });
    }

    const questions = await Question.find({ 
      domain: cleanDomain, 
      session: state.activeSession 
    });
    
    res.json({ active: true, session: state.activeSession, questions });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. DANGER ZONE: RESET DATABASE (NEW) ---
router.delete("/reset-database", async (req, res) => {
  try {
    const { target } = req.query; // 'questions', 'results', 'blocked', 'all'

    let message = "";

    if (target === 'questions' || target === 'all') {
      await Question.deleteMany({});
      message += "Questions Cleared. ";
    }
    
    if (target === 'results' || target === 'all') {
      await Result.deleteMany({});
      message += "Student Results Cleared. ";
    }

    if (target === 'blocked' || target === 'all') {
      // Unblock everyone
      await User.updateMany({}, { isBlocked: false });
      message += "All Users Unblocked. ";
    }

    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. FIX & DEBUG TOOLS ---
router.get("/force-fix-all", async (req, res) => {
  try {
    const questions = await Question.find();
    let count = 0;
    for (const q of questions) {
      q.session = "1"; 
      q.domain = q.domain.trim();
      if(!q.type) q.type="descriptive";
      if(!q.section) q.section="3";
      await q.save();
      count++;
    }
    res.json({ message: `Fixed ${count} questions.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/debug-check", async (req, res) => {
  try {
    const { domain, session } = req.query;
    const count = await Question.countDocuments({ domain: domain.trim(), session });
    res.json({ found: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Standard CRUD ---
router.delete("/:id", async (req, res) => { await Question.findByIdAndDelete(req.params.id); res.json({message:"Deleted"}); });
router.put("/:id", async (req, res) => { 
    // Simplified update for brevity
    await Question.findByIdAndUpdate(req.params.id, req.body); 
    res.json({message:"Updated"}); 
});
router.get("/all-admin", async (req, res) => { const q = await Question.find(); res.json(q); });

module.exports = router;