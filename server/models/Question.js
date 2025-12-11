// server/models/Question.js
const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  domain: { type: String, required: true },
  session: { type: String, required: true, default: "1" },
  
  // NEW FIELDS FOR DIFFERENT TYPES
  type: { 
    type: String, 
    enum: ['mcq', 'fill_ups', 'code_snippet', 'descriptive'], 
    default: 'descriptive' 
  },
  section: { type: String, default: "3" }, // Section 1, 2, or 3
  
  // Specific fields
  options: [String], // Array of strings like ["Option A", "Option B"...]
  codeSnippet: { type: String, default: "" }, // For code display
  correctAnswer: { type: String, default: "" } // Optional: For auto-grading later
});

module.exports = mongoose.model("Question", QuestionSchema);