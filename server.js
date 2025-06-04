const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ path: "/ws", server });

// Estado inicial do jogo
let gameState = {
  board: Array(9).fill(null),
  turn: "Ewerton",
  winner: null,
  lastStarter: "Hellen",
  players: []
};

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, ".")));

// Função para verificar vencedor
function checkWinner(game) {
  const b = game.board;
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let [a, b1, c] of lines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      game.winner = b[a] === "X" ? "Ewerton" : "Hellen";
      return;
    }
  }

  if (!b.includes(null)) {
    game.winner = "Empate";
  }
}

// Função para resetar o jogo
function resetGame() {
  const nextStarter = gameState.lastStarter === "Ewerton" ? "Hellen" : "Ewerton";
  gameState = {
    board: Array(9).fill(null),
    turn: nextStarter,
    winner: null,
    lastStarter: nextStarter,
    players: gameState.players
  };
}

// WebSocket: lidar com conexões
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "login") {
      if (!gameState.players.includes(data.player)) {
        gameState.players.push(data.player);
      }
      ws.send(JSON.stringify({ type: "gameState", game: gameState }));
    }

    if (data.type === "play" && !gameState.winner && data.player === gameState.turn) {
      if (!gameState.board[data.index]) {
        gameState.board[data.index] = data.player === "Ewerton" ? "X" : "O";
        gameState.turn = gameState.turn === "Ewerton" ? "Hellen" : "Ewerton";
        checkWinner(gameState);
        broadcastGameState();
      }
    }

    if (data.type === "reset") {
      resetGame();
      broadcastGameState();
    }
  });

  ws.on("close", () => {
    gameState.players = gameState.players.filter(p => p !== ws.player);
  });

  ws.send(JSON.stringify({ type: "gameState", game: gameState }));
});

// Enviar estado do jogo para todos os clientes
function broadcastGameState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "gameState", game: gameState }));
    }
  });
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});