const express = require("express");
const cors = require("cors"); // ✅ Fix CORS Issue
const connectDB = require("./db");
const users = require("./routes/users");
const path = require("path");

const app = express();
const port = 3000;

// ✅ Connect to Database
connectDB().then(() => {
    console.log("✅ Database connected successfully");
}).catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
});

// ✅ Middleware
app.use(cors()); // Fixes frontend connection issues
app.use(express.json()); // Allows JSON requests

// Define absolute paths
const landingPagePath = path.join(__dirname);
const frontendPath = path.join(__dirname, "..", "frontend");

console.log(frontendPath);


// Serve landing page (login)
app.use(express.static(landingPagePath));

// Serve frontend files
app.use("/frontend", express.static(frontendPath));

// ✅ Routes
app.use("/api", users);

// Route to serve frontend index.html on "/dashboard"
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Handle Undefined Routes
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
