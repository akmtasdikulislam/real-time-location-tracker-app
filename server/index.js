const express = require("express");
const app = express();
const https = require("https");
const os = require("os");
const fs = require("fs");
const { Server } = require("socket.io");

// SSL
const sslOptions = {
  key: fs.readFileSync("./server-ssl-key.pem"),
  cert: fs.readFileSync("./server-ssl.pem"),
};

// Create HTTPS Express Server
const expressServer = https.createServer(sslOptions, app);

// Create Socket Server
const io = new Server(expressServer, {
  cors: {
    origin: "*",
  },
});

// Current Network Address
const ipAddress = Object.values(os.networkInterfaces())[0][1].address;
const port = 5000;

// Storing each user's location data
let locationData = {};

// socket connection
io.on("connection", (socket) => {
  console.log(`New User Connected ${socket.id}`);

  socket.emit("connected", "Socket Connected Successfully");

  // socket disconnect
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);

  });
});

app.get("/", (req, res) => {
  res.send(`Server is running at https://${ipAddress}:${port}`);
});

expressServer.listen(5000, () => {
  console.log(`Server is running at https://${ipAddress}:${port}`);
});
