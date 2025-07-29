import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/session.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json()); // for form data
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Routes
app.get('/', (req, res) => {
    res.send('Backend is running!');
});
app.use("/auth", authRoutes);
app.use("/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
