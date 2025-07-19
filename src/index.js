const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors package
const folderRoutes = require("./routes/folderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const searchRoutes = require("./routes/searchRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

// Apply CORS middleware
app.use(cors());

// Body parser middleware
app.use(bodyParser.json());

// Routes
app.use("/folders", folderRoutes);
app.use("/files", fileRoutes);
app.use("/search", searchRoutes);
app.use("/user", userRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
