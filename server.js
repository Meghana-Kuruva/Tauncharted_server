const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sequelize } = require("./models");
const tradeShowRoutes = require("./routes/tradeShowRoutes");
const exhibitorRoutes = require("./routes/exhibitorRoutes");
const prospectRoutes = require("./routes/prospectRoutes");
const authRoutes = require("./routes/authRoutes");
const extractorRoutes = require("./routes/extractorRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tradeshows", tradeShowRoutes);
app.use("/api", exhibitorRoutes);
app.use("/api", prospectRoutes);
app.use("/api/extractor", extractorRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully");

    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synced");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️  Port ${PORT} busy, retrying in 1s...`);
        setTimeout(() => server.listen(PORT), 1000);
      } else {
        console.error("❌ Server error:", err.message);
        process.exit(1);
      }
    });

    // Graceful shutdown for nodemon
    const shutdown = () => {
      server.close(() => process.exit(0));
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("❌ Unable to start server:", err.message);
    process.exit(1);
  }
};

startServer();
