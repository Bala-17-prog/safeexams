// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "student"], default: "student" },
  // NEW: Flag to block access
  isBlocked: { type: Boolean, default: false } 
});

module.exports = mongoose.model("User", UserSchema);