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

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Base Routes (relative paths only)
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: "https://your-frontend.onrender.com",
    credentials: true
  }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  //const userId = socket.handshake.query.userId;
  const userId = socket.handshake.auth.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients
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
