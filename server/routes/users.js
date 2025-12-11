// server/routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 1. GET BLOCKED USERS
router.get("/blocked", async (req, res) => {
  try {
    const blockedUsers = await User.find({ isBlocked: true });
    // Send clean list
    res.json(blockedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. BLOCK USER
router.post("/block", async (req, res) => {
  try {
    const { username } = req.body;
    // Case-insensitive search
    const user = await User.findOneAndUpdate(
      { username: { $regex: new RegExp(`^${username}$`, "i") } }, 
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(`🚨 BLOCKED: ${user.username}`);
    res.json({ message: "Blocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UNBLOCK USER (FIXED)
router.post("/unblock", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: "User not found to unblock" });
    }

    console.log(`✅ UNBLOCKED: ${user.username}`);
    res.json({ message: `User ${user.username} unblocked successfully.` });
  } catch (err) {
    console.error("Unblock Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;