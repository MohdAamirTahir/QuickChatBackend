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

const allowedOrigins = [
  "http://localhost:3000",
  "https://quickchatfrontend.onrender.com"
];

app.use(express.json({ limit: "4mb" }));

// ✅ CORS for REST APIs
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // server-side requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true,
}));

// ✅ Handle OPTIONS preflight
app.options("*", cors({
  origin: allowedOrigins,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true,
}));

// Routes
app.use("/api/status", (req,res)=> res.send("Server is live ✅"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Socket.IO
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET","POST"],
    credentials: true,
  }
});

export const userSocketMap = {};

io.on("connection", socket => {
  const userId = socket.handshake.query.userId;
  if(userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Connect DB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server running on PORT " + PORT));

export default server;
