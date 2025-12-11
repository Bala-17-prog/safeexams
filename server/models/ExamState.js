// server/models/ExamState.js
const mongoose = require("mongoose");

const ExamStateSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  activeSession: { type: String, default: "1" }, // The currently active session
  isActive: { type: Boolean, default: false } // Is the exam currently running?
});

module.exports = mongoose.model("ExamState", ExamStateSchema);