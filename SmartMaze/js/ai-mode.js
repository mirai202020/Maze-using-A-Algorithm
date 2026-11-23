
window.SmartMazeAI = (() => {

  const game = window.SmartMaze;

  const DELAY = 400;
  const COUNTDOWN_DELAY = 1000;

  let attemptCount = 0;
  const attemptHistory = [];

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function manhattan(row, col) {
    return Math.abs(game.GOAL[0] - row) +
           Math.abs(game.GOAL[1] - col);
  }

  function updateAttemptDisplay() {
    const counter = game.element("attemptCount");

    if (counter) {
      counter.textContent = attemptCount;
    }

    const output = game.element("searchOutput");

    if (!output) return;

    output.innerHTML = "";

    if (attemptHistory.length === 0) {
      output.textContent = "No search attempts yet.";
      return;
    }
    [...attemptHistory].reverse().forEach(attempt => {
      const card = document.createElement("div");
      card.className = "attempt-card";

      const heading = document.createElement("h3");
      heading.textContent =
        `Attempt #${attempt.number} — ${attempt.status}`;

      const details = document.createElement("p");

      details.textContent =
        `Duration: ${attempt.duration} seconds | ` +
        `Energy Used: ${attempt.cost} | ` +
        `Remaining Energy: ${attempt.remaining} | ` +
        `Steps: ${attempt.steps} | ` +
        `Nodes Explored: ${attempt.explored}`;

      const path = document.createElement("p");

      path.textContent = attempt.path
        ? `Path: ${attempt.path}`
        : "Path: No feasible path found.";

      card.appendChild(heading);
      card.appendChild(details);
      card.appendChild(path);

      output.appendChild(card);
    });
  }

  function saveAttempt(result, duration) {
    const hasPath = Boolean(result.path);

    const attempt = {
      number: attemptCount,
      status: hasPath ? "Path Found" : "No Path",
      duration: (duration / 1000).toFixed(2),
      cost: hasPath ? result.cost : game.state.energyUsed,
      remaining: hasPath ? result.remaining : game.state.energy,
      steps: hasPath
        ? result.path.length - 1
        : game.state.steps,
      explored: result.explored ?? 0,
      path: hasPath
        ? result.path
            .map(([r, c]) => `R${r + 1}C${c + 1}`)
            .join(" → ")
        : null
    };

    attemptHistory.push(attempt);
    updateAttemptDisplay();
  }

  function findPath() {

    const start = {
      row: game.START[0],
      col: game.START[1],
      remaining: game.MAX_ENERGY,
      g: 0,
      h: manhattan(game.START[0], game.START[1]),
      path: [[...game.START]]
    };

    const open = [
      { ...start, f: start.g + start.h }
    ];

    const bestCost = new Map([
      [`${start.row},${start.col},${start.remaining}`, 0]
    ]);

    let explored = 0;

    while (open.length > 0) {

      open.sort((a, b) => a.f - b.f || a.h - b.h);

      const current = open.shift();

      const currentKey =
        `${current.row},${current.col},${current.remaining}`;

      if (current.g !== bestCost.get(currentKey)) {
        continue;
      }

      explored++;

      if (
        current.row === game.GOAL[0] &&
        current.col === game.GOAL[1]
      ) {
        return {
          path: current.path,
          cost: current.g,
          remaining: current.remaining,
          explored
        };
      }

      for (const [nextRow, nextCol] of
        game.neighbors(current.row, current.col)) {

        const moveCost = game.maze[nextRow][nextCol];

        if (moveCost > current.remaining) continue;

        const remaining = current.remaining - moveCost;
        const newCost = current.g + moveCost;

        const nextKey =
          `${nextRow},${nextCol},${remaining}`;

        if (newCost < (bestCost.get(nextKey) ?? Infinity)) {

          bestCost.set(nextKey, newCost);

          const h = manhattan(nextRow, nextCol);

          open.push({
            row: nextRow,
            col: nextCol,
            remaining,
            g: newCost,
            h,
            f: newCost + h,
            path: [...current.path, [nextRow, nextCol]]
          });
        }
      }
    }

    return {
      path: null,
      explored
    };
  }
  async function findPathAnimated(runToken) {

    const start = {
      row: game.START[0],
      col: game.START[1],
      remaining: game.MAX_ENERGY,
      g: 0,
      h: manhattan(game.START[0], game.START[1]),
      path: [[...game.START]]
    };

    const open = [
      { ...start, f: start.g + start.h }
    ];

    const bestCost = new Map([
      [`${start.row},${start.col},${start.remaining}`, 0]
    ]);

    let explored = 0;

    while (open.length > 0) {

      if (game.state.searchToken !== runToken) {
        return { cancelled: true };
      }

      open.sort((a, b) => a.f - b.f || a.h - b.h);

      const current = open.shift();

      const currentKey =
        `${current.row},${current.col},${current.remaining}`;

      if (current.g !== bestCost.get(currentKey)) {
        continue;
      }

      explored++;

      game.state.position = [
        current.row,
        current.col
      ];

      game.state.energy = current.remaining;
      game.state.energyUsed = current.g;
      game.state.steps = current.path.length - 1;
      game.state.nodesExplored = explored;

      game.state.exploredSet.add(
        `${current.row},${current.col}`
      );

      game.render();

      game.element("status").innerHTML =
        `<b>AI is searching...</b><br>
        Attempt: <b>#${attemptCount}</b><br>
        Exploring position:
        <b>R${current.row + 1}, C${current.col + 1}</b><br>
        Energy consumed: <b>${current.g}</b><br>
        Nodes explored: <b>${explored}</b>`;

      game.element("result").textContent = "Searching";

      await sleep(DELAY);

      if (game.state.searchToken !== runToken) {
        return { cancelled: true };
      }

      if (
        current.row === game.GOAL[0] &&
        current.col === game.GOAL[1]
      ) {
        return {
          path: current.path,
          cost: current.g,
          remaining: current.remaining,
          explored
        };
      }

      for (const [nextRow, nextCol] of
        game.neighbors(current.row, current.col)) {

        const moveCost = game.maze[nextRow][nextCol];

        if (moveCost > current.remaining) continue;

        const remaining = current.remaining - moveCost;
        const newCost = current.g + moveCost;

        const nextKey =
          `${nextRow},${nextCol},${remaining}`;

        if (newCost < (bestCost.get(nextKey) ?? Infinity)) {

          bestCost.set(nextKey, newCost);

          const h = manhattan(nextRow, nextCol);

          open.push({
            row: nextRow,
            col: nextCol,
            remaining,
            g: newCost,
            h,
            f: newCost + h,
            path: [...current.path, [nextRow, nextCol]]
          });
        }
      }
    }

    return {
      path: null,
      explored
    };
  }
  async function start() {

    game.resetState();

    const state = game.state;

    state.mode = "AI Mode";
    state.searching = true;

    state.attempts++;

    game.render();

    attemptCount++;
    updateAttemptDisplay();

    const runToken = state.searchToken;

    for (let number = 3; number >= 1; number--) {

      if (game.state.searchToken !== runToken) return;

      game.setStatus(
        `<div style="text-align:center;">
          <h2 style="color:#38bdf8;">AI STARTING IN</h2>
          <div style="
            font-size:55px;
            font-weight:bold;
            color:#22c55e;
            text-shadow:0 0 15px #22c55e;
          ">${number}</div>
          <p>Preparing A* Search Algorithm...</p>
          <p>Search Attempt: #${attemptCount}</p>
        </div>`,
        "Preparing"
      );

      await sleep(COUNTDOWN_DELAY);
    }

    if (game.state.searchToken !== runToken) return;

    game.setStatus(
      `<h3 style="color:#38bdf8;">AI SEARCH STARTED!</h3>
       Attempt #${attemptCount}<br>
       The agent is exploring possible paths to the goal...`,
      "Searching"
    );

    await sleep(700);

    if (game.state.searchToken !== runToken) return;

    const startTime = performance.now();

    const result = await findPathAnimated(runToken);

    const duration = performance.now() - startTime;

    if (result.cancelled) return;

    state.searching = false;
    state.nodesExplored = result.explored;


    if (!result.path) {

      game.setPath(null);

      state.finished = true;

      saveAttempt(result, duration);

      window.SmartMazeApp.showResults({
        solved: false,
        cost: state.energyUsed,
        remaining: state.energy,
        steps: state.steps,
        explored: result.explored,
        duration: (duration / 1000).toFixed(2),
        path: null
      });

      return;
    }

    game.setPath(result.path);

    state.position = [...game.GOAL];
    state.energy = result.remaining;
    state.energyUsed = result.cost;
    state.steps = result.path.length - 1;
    state.finished = true;

    saveAttempt(result, duration);

    window.SmartMazeApp.showResults({
      solved: true,
      cost: result.cost,
      remaining: result.remaining,
      steps: state.steps,
      explored: result.explored,
      duration: (duration / 1000).toFixed(2),
      path: result.path
        .map(([r, c]) => `R${r + 1}C${c + 1}`)
        .join(" → ")
    });
  }

  return {
    findPath,
    findPathAnimated,
    start
  };

})();
