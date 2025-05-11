module.exports = (io) => {
  io.on("connection", (socket) => {
    let currentCode = null;

    socket.on("joinGame", (data) => {
      currentCode = data.code;

      // Initialize game state if not present
      if (!games[currentCode]) {
        games[currentCode] = {
          white: null,
          black: null,
          spectators: [],
          gameStarted: false,
        };
      }

      socket.join(currentCode);

      // Handle player joins
      if (data.isSpectator) {
        games[currentCode].spectators.push(socket.id);
        io.to(currentCode).emit("newSpectator", socket.id);
      } else {
        if (games[currentCode].white === null) {
          games[currentCode].white = socket.id; // Assign white player
        } else if (games[currentCode].black === null) {
          games[currentCode].black = socket.id; // Assign black player
        }
      }

      // Start game if both players are connected
      if (
        games[currentCode].white &&
        games[currentCode].black &&
        !games[currentCode].gameStarted
      ) {
        games[currentCode].gameStarted = true;
        io.to(currentCode).emit("startGame"); // Emit to both players and spectators
      }
    });

    // Handle move events
    socket.on("move", function (move) {
      if (games[currentCode].gameStarted) {
        io.to(currentCode).emit("newMove", move);
      }
    });

    // Handle chat messages
    socket.on("chatMessage", (message) => {
      io.to(currentCode).emit("newChatMessage", message); // Broadcast message to the game room
    });

    // Handle disconnects
    socket.on("disconnect", function () {
      if (currentCode) {
        if (games[currentCode].spectators.length > 0) {
          io.to(currentCode).emit("spectatorLeft", socket.id);
        } else {
          io.to(currentCode).emit("gameOverDisconnect");
          delete games[currentCode];
        }
      }
    });
  });
};