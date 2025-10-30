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

// ✅ Middleware for JSON
app.use(express.json({ limit: "4mb" }));

// ✅ CORS middleware (safe for Render + preflight)
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // server-side requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("❌ Blocked CORS request from:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Handle OPTIONS preflight globally
app.options("*", cors());

// ✅ Routes
app.use("/api/status", (req, res) => res.send("Server is live ✅"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Online users store
export const userSocketMap = {};

// ✅ Socket.IO connection
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("✅ User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Connect to MongoDB
await connectDB();

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export for Render / Vercel
export default server;
