import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// --------- SOCKET.IO SETUP ---------
export const io = new Server(server, {
  cors: {
    origin: [
      "https://quickchatfrontend.onrender.com", // deployed frontend
      "http://localhost:3000", // local frontend testing
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
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

// --------- MIDDLEWARE ---------
app.use(express.json({ limit: "4mb" }));

// CORS configuration
app.use(
  cors({
    origin: [
      "https://quickchatfrontend.onrender.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

// --------- ROUTES ---------
app.get("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// --------- DATABASE CONNECTION ---------
try {
  await connectDB();
  console.log("MongoDB connected successfully");
} catch (error) {
  console.error("MongoDB connection error:", error.message);
}

// --------- START SERVER ---------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

// Export server for Vercel or testing
export default server;
