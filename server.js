const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sequelize, TradeShow, Exhibitor, Prospect } = require("./models");
const { seedTradeShows } = require("./seedTradeShows");
const { seedExhibitors } = require("./seedExhibitors");
const { seedProspects } = require("./seedProspects");

const tradeShowRoutes = require("./routes/tradeShowRoutes");
const exhibitorRoutes = require("./routes/exhibitorRoutes");
const prospectRoutes = require("./routes/prospectRoutes");
const authRoutes = require("./routes/authRoutes");
const extractorRoutes = require("./routes/extractorRoutes");

const app = express();
const PORT = process.env.PORT || 5050;

//
// ========================
// ✅ CORS CONFIG (FIXED)
// ========================
//
const allowedOrigins = [
  "https://tauncharted-client.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌍 Request from origin:", origin);

      // allow requests with no origin (like Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Handle preflight requests
app.options("*", cors());

//
// ========================
// ✅ BODY PARSER
// ========================
//
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

//
// ========================
// ✅ ROUTES
// ========================
//
app.use("/api/auth", authRoutes);
app.use("/api/tradeshows", tradeShowRoutes);
app.use("/api", exhibitorRoutes);
app.use("/api", prospectRoutes);
app.use("/api/extractor", extractorRoutes);

//
// ========================
// ✅ TEST ROUTES
// ========================
//
app.get("/", (req, res) => {
  res.send("Backend is running on Render 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API working 🚀",
    timestamp: new Date().toISOString(),
  });
});

//
// ========================
// ✅ START SERVER
// ========================
//
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully");

    await sequelize.sync();
    console.log("✅ Database tables synced");

    // Seed data if empty
    const tradeShowCount = await TradeShow.count();
    if (tradeShowCount === 0) {
      console.log("🧩 Seeding trade shows...");
      await seedTradeShows();
    }

    const exhibitorCount = await Exhibitor.count();
    if (exhibitorCount === 0) {
      console.log("🧩 Seeding exhibitors...");
      await seedExhibitors();
    }

    const prospectCount = await Prospect.count();
    if (prospectCount === 0) {
      console.log("🧩 Seeding prospects...");
      await seedProspects();
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle port busy issue
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️ Port ${PORT} busy, retrying...`);
        setTimeout(() => server.listen(PORT), 1000);
      } else {
        console.error("❌ Server error:", err.message);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log("🛑 Shutting down server...");
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