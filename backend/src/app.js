const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize app
const app = express();

// ================================
// ✅ Middleware
// ================================
// CORS: In production, optionally restrict to configured origins (comma-separated)
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (isProd && allowedOrigins.length) {
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
} else {
  app.use(cors());
}
app.use(express.json());
app.use(morgan("dev"));

// In development, disable ETag and caching to avoid 304s during testing
if (process.env.NODE_ENV !== "production") {
  try { app.set("etag", false); } catch (_e) {}
  app.use((req, res, next) => {
    if (req.method === "GET") {
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    }
    next();
  });
}

// ================================
// ✅ Route Imports
// ================================
const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const donorRoutes = require("./routes/donors");
const hospitalRoutes = require("./routes/hospitals");
const inventoryRoutes = require("./routes/inventory");
const matchesRoutes = require("./routes/matches");
const adminRoutes = require("./routes/admin");
const donationRoutes = require("./routes/donation");
const { verifyToken } = require("./middleware/auth");

// ================================
// ✅ Health Check
// ================================
app.get("/", (req, res) => {
  res.json({ message: "🩸 Blood Donation System Backend Running Successfully!" });
});

// ================================
// ✅ API Mount Points
// ================================

// 🧠 Authentication (Donor + Admin)
app.use("/api/v1/auth", authRoutes);

// 🩸 Core Functional Routes
app.use("/api/v1/donors", donorRoutes);
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/matches", matchesRoutes);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/admin", adminRoutes);

// 🛎️ Temporary Alerts Route
app.use("/api/v1/alerts", verifyToken, (req, res) => {
  res.json([
    { id: 1, message: "Your last donation was verified ✅" },
    { id: 2, message: "Upcoming blood camp on Nov 10 🩸" },
  ]);
});

// ================================
// ✅ Backward Compatibility (Optional)
// ================================
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

// ================================
// ✅ Error Handling
// ================================
app.use((req, res) => {
  console.warn(`⚠️ Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Server error" });
});

// ================================
// ✅ Export app
// ================================
module.exports = app;
