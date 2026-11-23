
window.SmartMazeHuman = (() => {
    const game = window.SmartMaze;

    let startTime = 0;
    let pathTaken = [];

    function formatPath(path) {
        return path
            .map(([row, col]) => `R${row + 1}C${col + 1}`)
            .join(" → ");
    }

    function finishGame(solved) {
        const state = game.state;

        state.finished = true;
        state.searching = false;

        game.stopTimer();

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);

        game.setPath(pathTaken);

        game.setStatus(
            solved
                ? "<b>You reached the goal!</b> Your Human Mode results are ready."
                : "<b>Not enough energy to continue.</b> Your attempt has ended.",
            solved ? "Solved" : "Failed"
        );

        if (window.SmartMazeApp) {
            window.SmartMazeApp.showResults({
                mode: "Human Mode",
                solved: solved,
                title: solved ? "MAZE COMPLETED!" : "OUT OF ENERGY",
                cost: state.energyUsed,
                remaining: state.energy,
                steps: state.steps,
                explored: "N/A",
                duration: duration,
                path: formatPath(pathTaken)
            });
        }
    }

    function start() {
        game.resetState();

        const state = game.state;

        state.mode = "Human Mode";
        state.finished = false;
        state.searching = false;

        pathTaken = [[...game.START]];

        startTime = performance.now();

        game.render();
        game.startTimer();

        game.setStatus(
            "Human Mode is active. Use the arrow keys or W, A, S, D to move toward the goal.",
            "Playing"
        );
    }

    function move(rowChange, colChange) {
        const state = game.state;

        if (state.mode !== "Human Mode" || state.finished) {
            return;
        }

        const nextRow = state.position[0] + rowChange;
        const nextCol = state.position[1] + colChange;

        if (
            nextRow < 0 ||
            nextRow >= game.SIZE ||
            nextCol < 0 ||
            nextCol >= game.SIZE
        ) {
            game.setStatus(
                "Move rejected: that position is outside the maze.",
                "Playing"
            );
            return;
        }

        const moveCost = game.maze[nextRow][nextCol];

        
        if (moveCost === 0) {
            game.setStatus(
                "Move rejected: that cell is blocked by a wall.",
                "Playing"
            );
            return;
        }

        
        if (moveCost > state.energy) {
            finishGame(false);
            return;
        }

     
        state.position = [nextRow, nextCol];
        state.energy -= moveCost;
        state.energyUsed += moveCost;
        state.steps++;

 
        pathTaken.push([nextRow, nextCol]);

        game.render();

 
        if (
            nextRow === game.GOAL[0] &&
            nextCol === game.GOAL[1]
        ) {
            finishGame(true);
        } else {
            game.setStatus(
                `Valid move. Entered a cell costing ${moveCost} energy unit(s).`,
                "Playing"
            );
        }
    }

    function handleKey(event) {
        const key = event.key.toLowerCase();

        const moves = {
            arrowup: [-1, 0],
            w: [-1, 0],

            arrowdown: [1, 0],
            s: [1, 0],

            arrowleft: [0, -1],
            a: [0, -1],

            arrowright: [0, 1],
            d: [0, 1]
        };

        if (moves[key]) {
            event.preventDefault();
            move(...moves[key]);
        }
    }

    return {
        start,
        move,
        handleKey
    };
})();
