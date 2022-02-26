require("dotenv").config();
const { instrument } = require("@socket.io/admin-ui");

const path = require("path");

const express = require("express");

const app = express();
app.use(express.static(path.join(__dirname, "/client")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/client", "index.html"));
});

app.listen(process.env.PORT || 8081);

const io = require("socket.io")(process.env.PORT_SOCKET ||3000, {
  cors: {
    origin: [ "https://admin.socket.io",process.env.APP_URL],
  },
});
const userIo = io.of("/user");
userIo.on("connection", (socket) => {
  console.log("connected to user namespace " + socket.username);
});

userIo.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    socket.username = getUsernameFromToken(token);
    next();
  } else {
    next(new Error("please send token"));
  }
});
function getUsernameFromToken(token) {
  return token;
}
io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("send-message", (message, room) => {
    // io.emit('receive-message',message); send for all client
    if (room === "") socket.broadcast.emit("receive-message", message);
    // to  room has broadcast by default
    else socket.to(room).emit("receive-message", message);
    console.log(message);
  });

  socket.on("join-room", (room, cb) => {
    socket.join(room);
    cb(`Joined ${room}`);
    // cb for slow internet connection to give callback
  });
  socket.on("ping", (n) => console.log(n));
});
instrument(io, { auth: false });

