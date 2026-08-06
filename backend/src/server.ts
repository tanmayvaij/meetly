import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT || 3001;

// Keep track of which users are in which rooms
// In a real app you might use Redis or a database
const rooms: Record<string, string[]> = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);

    console.log(`User ${socket.id} joined room ${roomId}`);

    // If there is another user in the room, tell this user about them
    // For 1-1, if the length > 1, get the other user.
    const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
    if (otherUsers.length > 0) {
      socket.emit("other-user", otherUsers[0]);
      socket.to(otherUsers[0]).emit("user-joined", socket.id);
    }
  });

  socket.on("offer", (payload) => {
    console.log(`Offer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit("offer", {
      caller: socket.id,
      sdp: payload.sdp
    });
  });

  socket.on("answer", (payload) => {
    console.log(`Answer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit("answer", {
      caller: socket.id,
      sdp: payload.sdp
    });
  });

  socket.on("ice-candidate", (payload) => {
    // console.log(`ICE candidate from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit("ice-candidate", {
      candidate: payload.candidate,
      sender: socket.id
    });
  });

  socket.on("disconnecting", () => {
    const roomsArray = Array.from(socket.rooms);
    roomsArray.forEach((roomId) => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        socket.to(roomId).emit("user-disconnected", socket.id);
        
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.send("Video Call Signaling Server is running");
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
