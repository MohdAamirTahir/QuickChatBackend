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

// CORS middleware (must be BEFORE routes)
app.use(cors({
  origin: [
    "http://localhost:3000",               // local dev
    "https://quickchatfrontend.onrender.com" // production
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: "4mb" }));

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Socket.IO
export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://quickchatfrontend.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId; // <- frontend sends userId via auth
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
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

export default server;
