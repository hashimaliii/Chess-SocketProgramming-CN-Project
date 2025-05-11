// Store game data
let games = {}; // This will track active games by code

module.exports = (app) => {
  // Serve the main index page
  app.get("/", (req, res) => {
    res.render("index");
  });

  // Route for White player
  app.get("/white", (req, res) => {
    let code = req.query.code;
    if (!games[code]) {
      games[code] = {
        white: null,
        black: null,
        spectators: [],
        gameStarted: false,
      };
    }

    games[code].white = "player"; // Assign white player
    res.render("game", { color: "white", code });
  });

  // Route for Black player
  app.get("/black", (req, res) => {
    let code = req.query.code;
    if (!games[code]) {
      return res.redirect("/?error=invalidCode");
    }

    // Assign black player
    games[code].black = "player";

    // Check if both players are joined, if so, start the game
    if (games[code].white && games[code].black && !games[code].gameStarted) {
      games[code].gameStarted = true; // Start the game
      res.render("game", { color: "black", code });
      // The game start event should be handled in `io.js`, no need to emit it here
    } else {
      res.render("game", { color: "black", code });
    }
  });

  // Route for spectators
  app.get("/spectator", (req, res) => {
    let code = req.query.code;
    if (!games[code]) {
      return res.redirect("/?error=invalidCode");
    }
    res.render("game", { color: "spectator", code });
  });
};
