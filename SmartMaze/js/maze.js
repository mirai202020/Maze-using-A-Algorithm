
// Shared maze configuration and common game state.
window.SmartMaze = (() => {

  // 0 = Wall
  // 1 = Walkable corridor (energy cost 1)
  // 3 = Walkable corridor (energy cost 3)
  // 5 = Walkable corridor (energy cost 5)

  const SIZE = 10;
  const START = [0, 0];
  const GOAL = [9, 9];
  const MAX_ENERGY = 30;

  // Shared maze array.
  const maze = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(0)
  );

  // Generate a more challenging random maze.
  function generateMaze() {

    // Begin with all cells as walls.
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        maze[row][col] = 0;
      }
    }

    // Create a guaranteed route from Start to Goal.
    const guaranteedPath = [[0, 0]];

    let row = 0;
    let col = 0;

    while (row < SIZE - 1 || col < SIZE - 1) {

      const possibleMoves = [];

      if (row < SIZE - 1) {
        possibleMoves.push("down");
      }

      if (col < SIZE - 1) {
        possibleMoves.push("right");
      }

      const move =
        possibleMoves[
          Math.floor(Math.random() * possibleMoves.length)
        ];

      if (move === "down") {
        row++;
      } else {
        col++;
      }

      guaranteedPath.push([row, col]);
    }

    // Keep the guaranteed route walkable.
    // Every cell on this route costs only 1 energy.
    guaranteedPath.forEach(([r, c]) => {
      maze[r][c] = 1;
    });

    const guaranteedSet = new Set(
      guaranteedPath.map(([r, c]) => `${r},${c}`)
    );

    // Generate additional walls and energy-cost corridors.
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {

        const key = `${r},${c}`;

        // Do not change the guaranteed route.
        if (guaranteedSet.has(key)) {
          continue;
        }

        // 50% chance of opening an additional corridor.
        if (Math.random() < 0.50) {

          const costChance = Math.random();

          if (costChance < 0.20) {
            maze[r][c] = 1; // 20% cost 1

          } else if (costChance < 0.60) {
            maze[r][c] = 3; // 40% cost 3

          } else {
            maze[r][c] = 5; // 40% cost 5
          }

        } else {
          maze[r][c] = 0; // 50% walls
        }
      }
    }

    // Always keep Start and Goal accessible.
    maze[START[0]][START[1]] = 1;
    maze[GOAL[0]][GOAL[1]] = 1;
  }

  const state = {
    position: [...START],
    energy: MAX_ENERGY,
    energyUsed: 0,
    steps: 0,
    nodesExplored: 0,
    attempts: 0,
    elapsedTime: 0,
    timerStartedAt: null,
    timerInterval: null,
    mode: "Ready",
    finished: false,
    path: [],
    pathSet: new Set(),
    exploredSet: new Set(),
    searching: false,
    searchToken: 0
  };

  const element = id => document.getElementById(id);

  // Update the displayed search time.
  function updateTimer() {
    if (state.timerStartedAt !== null) {
      state.elapsedTime = Date.now() - state.timerStartedAt;
    }

    const totalSeconds = Math.floor(state.elapsedTime / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    const timeElement = element("time");

    if (timeElement) {
      timeElement.textContent = `${minutes}:${seconds}`;
    }
  }

  // Start measuring AI or Human Mode time.
  function startTimer() {
    stopTimer();

    state.elapsedTime = 0;
    state.timerStartedAt = Date.now();

    updateTimer();

    state.timerInterval = setInterval(updateTimer, 100);
  }

  // Stop the timer and preserve the final time.
  function stopTimer() {
    if (state.timerInterval !== null) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    if (state.timerStartedAt !== null) {
      state.elapsedTime = Date.now() - state.timerStartedAt;
      state.timerStartedAt = null;
    }

    updateTimer();
  }

  // Reset the game and generate a new maze.
  function resetState() {
    stopTimer();

    // Cancel any previous animated search.
    state.searchToken++;

    // Generate a different random maze.
    generateMaze();

    state.position = [...START];
    state.energy = MAX_ENERGY;
    state.energyUsed = 0;
    state.steps = 0;
    state.nodesExplored = 0;
    state.mode = "Ready";
    state.finished = false;
    state.path = [];
    state.pathSet = new Set();
    state.exploredSet = new Set();
    state.searching = false;

    const pathText = element("pathText");

    if (pathText) {
      pathText.textContent = "No path generated yet.";
    }

    render();

    setStatus(
      "A new challenging maze has been generated! Choose START AI or HUMAN MODE to begin.",
      "Ready"
    );
  }

  // Draw the 10x10 maze.
  function render() {
    const board = element("maze");

    if (!board) return;

    board.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {

        const value = maze[row][col];
        const key = `${row},${col}`;

        const cell = document.createElement("div");

        if (value === 0) {
          cell.className = "cell wall";
        } else {
          cell.className = "cell corridor";

          if (value === 3) {
            cell.classList.add("cost3");
          } else if (value === 5) {
            cell.classList.add("cost5");
          } else {
            cell.classList.add("cost1");
          }
        }

        const isAgent =
          row === state.position[0] &&
          col === state.position[1];

        if (state.exploredSet.has(key)) {
          cell.classList.add("explored");
        }

        if (state.pathSet.has(key)) {
          cell.classList.add("path");
        }

        if (isAgent) {
          cell.classList.add("agent");
        }

        // Display the AI or Human character.
        if (isAgent) {

          cell.textContent =
            state.mode === "Human Mode" ? "🧑" : "🤖";

        } else if (row === START[0] && col === START[1]) {

          cell.classList.add("start");
          cell.textContent = "S";

        } else if (row === GOAL[0] && col === GOAL[1]) {

          cell.classList.add("goal");
          cell.textContent = "G";

        } else {

          cell.textContent = "";
        }

        board.appendChild(cell);
      }
    }

    element("mode").textContent = state.mode;

    element("energy").textContent =
      `${state.energy} / ${MAX_ENERGY}`;

    element("used").textContent = state.energyUsed;
    element("steps").textContent = state.steps;
    element("nodes").textContent = state.nodesExplored;

    const attemptsElement = element("attempts");

    if (attemptsElement) {
      attemptsElement.textContent = state.attempts;
    }

    updateTimer();
  }

  function setStatus(message, result) {
    element("status").innerHTML = message;
    element("result").textContent = result;

    render();
  }

  function setPath(path) {
    state.path = path || [];

    state.pathSet = new Set(
      state.path.map(([r, c]) => `${r},${c}`)
    );

    element("pathText").textContent = path
      ? path.map(([r, c]) => `(${r + 1},${c + 1})`).join(" → ")
      : "No feasible path found.";

    render();
  }
 
  function neighbors(row, col) {
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ].filter(([r, c]) =>
      r >= 0 &&
      r < SIZE &&
      c >= 0 &&
      c < SIZE &&
      maze[r][c] !== 0
    );
  }

 
  generateMaze();

  return {
    maze,
    SIZE,
    START,
    GOAL,
    MAX_ENERGY,
    state,
    element,
    generateMaze,
    resetState,
    render,
    setStatus,
    setPath,
    neighbors,
    startTimer,
    stopTimer
  };

})();
