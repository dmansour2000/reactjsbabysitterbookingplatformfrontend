const express = require("express");
const path = require("path");

const app = express();

// Serve static files from the "build" directory
app.use(express.static(path.join(__dirname, "dist")));

// Handle all routes by sending the React app's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5170;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
