const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require("./config/database");
connectDB();

const app = express();

// CORS configuration - allow multiple origins
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000", // Create React App default
  "https://lottery-frontend-j422lcvpk-nikhils-projects-2570a626.vercel.app",
  "https://lottery-frontend-j422lcvpk-nikhils-projects-2570a626.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/number-guess", require("./routes/numberGuessRoutes"));
app.use("/api", require("./routes/leaderboard"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/withdrawal", require("./routes/withdrawal"));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Achie Coins API is running",
    timestamp: new Date().toISOString(),
  });
});

// Handle undefined routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
  // console.log(`✅ CORS enabled for origins:`, allowedOrigins);
});

module.exports = app;
