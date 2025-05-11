let isSpectator = false; // Track if the user is a spectator
let gameHasStarted = false;
var board = null;
var game = new Chess();
var $status = $("#status");
var $pgn = $("#pgn");
let gameOver = false;

function onDragStart(source, piece, position, orientation) {
  if (game.game_over() || !gameHasStarted || gameOver || isSpectator)
    return false;

  if (
    (playerColor === "black" && piece.search(/^w/) !== -1) ||
    (playerColor === "white" && piece.search(/^b/) !== -1)
  ) {
    return false;
  }

  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  let theMove = {
    from: source,
    to: target,
    promotion: "q",
  };

  var move = game.move(theMove);

  // Illegal move
  if (move === null) return "snapback";

  socket.emit("move", theMove);

  updateStatus();
}

socket.on("newMove", function (move) {
  game.move(move);
  board.position(game.fen());
  updateStatus();
});

// Update the board position after the piece snap
function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  var status = "";
  var moveColor = "White";

  if (game.turn() === "b") {
    moveColor = "Black";
  }

  // Checkmate?
  if (game.in_checkmate()) {
    status = "Game over, " + moveColor + " is in checkmate.";
  }
  // Draw?
  else if (game.in_draw()) {
    status = "Game over, drawn position";
  } else if (gameOver) {
    status = "Opponent disconnected, you win!";
  } else if (!gameHasStarted) {
    status = "Waiting for black to join";
  } else if (isSpectator) {
    status = "Spectator mode: Watching the game";
  } else {
    status = moveColor + " to move";

    // Check?
    if (game.in_check()) {
      status += ", " + moveColor + " is in check";
    }
  }

  $status.html(status);
  $pgn.html(game.pgn());
}

var config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: "/public/img/chesspieces/wikipedia/{piece}.png",
};

board = Chessboard("myBoard", config);

if (playerColor === "black") {
  board.flip();
}

updateStatus();

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("code")) {
  isSpectator = urlParams.get("spectator") === "true"; // Check if user is a spectator
  socket.emit("joinGame", {
    code: urlParams.get("code"),
    isSpectator: isSpectator,
  });
}

socket.on("startGame", function () {
  gameHasStarted = true;
  updateStatus();
});

socket.on("gameOverDisconnect", function () {
  gameOver = true;
  updateStatus();
});
// Ensure that the DOM is fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Chat message sending
  document.getElementById("sendMessage").addEventListener("click", function () {
    const messageText = document.getElementById("message").value; // Get message text
    if (messageText.trim() !== "" && playerColor !== "spectator") {
      const message = {
        text: messageText,
        sender: playerColor, // Color of the player (white or black)
        timestamp: new Date().toLocaleTimeString(),
      };

      socket.emit("chatMessage", message); // Send the message to the server
      document.getElementById("message").value = ""; // Clear the input box
    }
  });

  // Receiving chat messages and displaying them
  socket.on("newChatMessage", function (message) {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("li");
    messageElement.textContent = `${message.timestamp} ${message.sender}: ${message.text}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
  });
});

// For spectators: hide chat input
if (isSpectator) {
  document.getElementById("chatInput").style.display = "none"; // Hide chat input for spectators
  document.getElementById("spectatorMessage").style.display = "block"; // Show spectator message
}
