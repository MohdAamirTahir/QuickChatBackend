import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// ✅ Allowed Frontend URLs
const allowedOrigins = [
  "http://localhost:3000",
  "https://quickchatfrontend.onrender.com"
];

// ✅ CORS setup (Render-safe)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow requests with no origin (Postman/server)
      const cleanedOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (o) => o.replace(/\/$/, "") === cleanedOrigin
      );
      if (isAllowed) callback(null, true);
      else {
        console.log("❌ Blocked CORS request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Socket.IO setup with same origins
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Middleware
app.use(express.json({ limit: "4mb" }));

// ✅ Routes
app.use("/api/status", (req, res) => res.send("Server is live ✅"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Socket.IO connections
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  // ⚠️ FIX: Get userId from query OR auth payload
  const userId = socket.handshake.query.userId || socket.handshake.auth?.userId;
  console.log("✅ User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Connect DB
await connectDB();

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export (for Vercel/Render)
export default server;
