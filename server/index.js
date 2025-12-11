const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// IMPORT ROUTES
const authRoute = require("./routes/auth");
const questionRoute = require("./routes/questions");
const resultRoute = require("./routes/results");
const userRoute = require("./routes/users");

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://safeexam-frontend.onrender.com"   // update once frontend is deployed
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

const MONGO_URI = const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

app.use("/api/auth", authRoute);
app.use("/api/questions", questionRoute);
app.use("/api/results", resultRoute);
app.use("/api/users", userRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

