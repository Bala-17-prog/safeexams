// server/models/Result.js
const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
  username: { type: String, required: true },
  domain: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  status: { type: String, enum: ["Pass", "Fail"], required: true },
  answers: { type: Map, of: String },
  // NEW: Track cheating attempts
  violationCount: { type: Number, default: 0 }, 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", ResultSchema);