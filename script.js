let player = null;
const boardDiv = document.getElementById("board");
const info = document.getElementById("info");
let ws;

function login(name) {
  player = name;
  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";

  // Conectar ao WebSocket (usar wss:// no Render)
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "login", player: name }));
    info.textContent = `Conectado! Escolhendo jogador ${name}...`;
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "gameState") {
      render(message.game);
    }
  };

  ws.onerror = () => {
    info.textContent = "Erro na conexão com o servidor. Tente recarregar a página.";
  };

  ws.onclose = () => {
    info.textContent = "Conexão perdida. Tente recarregar a página.";
  };
}

function render(game) {
  boardDiv.innerHTML = "";

  game.board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = cell || "";
    div.onclick = () => play(i);
    boardDiv.appendChild(div);
  });

  if (game.winner) {
    if (game.winner === "Empate") {
      info.textContent = "Empate! Reiniciando...";
    } else {
      info.textContent = `${game.winner} ganhou um vale! Reiniciando...`;
    }
    setTimeout(() => {
      ws.send(JSON.stringify({ type: "reset" }));
    }, 3000);
  } else {
    if (game.turn === player) {
      info.textContent = `Vez do ${player}`;
    } else {
      info.textContent = `Vez do ${game.turn}`;
    }
  }
}

function play(index) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    info.textContent = "Não conectado ao servidor. Tente recarregar.";
    return;
  }
  ws.send(JSON.stringify({ type: "play", index, player }));
}