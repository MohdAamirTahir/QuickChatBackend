import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app
const app = express();
const server = http.createServer(app);

// CORS Middleware - allow your frontend only
// app.use(cors({
//   origin: "https://quickchatfrontend.onrender.com", // your deployed frontend
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true, // required for cookies or auth headers
// }));
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // allow all origins (for testing)
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Middleware
app.use(express.json({ limit: "4mb" }));

// Base Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Initialize Socket.io with proper CORS
export const io = new Server(server, {
  cors: {
    origin: "https://quickchatfrontend.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId; // correct way for Socket.io v4+
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Connect to MongoDB
await connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on PORT: " + PORT));

export default server; // for Render / testing
