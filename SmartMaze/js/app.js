document.addEventListener("DOMContentLoaded", () => {
    const game = window.SmartMaze;
    const $ = game.element;

    let lastResultMode = "AI Mode";

    const winMusic = new Audio("audio/win.mp3");
    const loseMusic = new Audio("audio/lose.mp3");

    function playResultMusic(isSolved) {
        winMusic.pause();
        winMusic.currentTime = 0;
        loseMusic.pause();
        loseMusic.currentTime = 0;

        const track = isSolved ? winMusic : loseMusic;
        track.play().catch(err => console.warn("Audio playback blocked:", err));
    }

    function stopResultMusic() {
        winMusic.pause();
        winMusic.currentTime = 0;
        loseMusic.pause();
        loseMusic.currentTime = 0;
    }
    function showScreen(screen) {
        $("homeScreen").hidden = screen !== "home";
        $("gameScreen").hidden = screen !== "game";
        $("resultsScreen").hidden = screen !== "results";
    }

    function openGame() {
        stopResultMusic();
        showScreen("game");
    }

    function goHome() {
        stopResultMusic();
        game.resetState();
        showScreen("home");
    }

    window.SmartMazeApp = {
        showResults(data) {
            lastResultMode = data.mode || game.state.mode || "AI Mode";
            $("resultSubtitle").textContent = `${lastResultMode} Performance Results`;

            const isSolved = Boolean(data.solved);
            const resultsScreen = $("resultsScreen");
            resultsScreen.classList.toggle("solved", isSolved);
            resultsScreen.classList.toggle("failed", !isSolved);

            $("resultTitle").textContent =
                data.title ||
                (isSolved ? "MAZE SOLVED!" : "OUT OF ENERGY");

            $("finalCost").textContent = data.cost;
            $("finalEnergy").textContent = data.remaining;
            $("finalSteps").textContent = data.steps;
            $("finalNodes").textContent = data.explored ?? "N/A";

            $("finalTime").textContent =
                `${data.duration} seconds`;

            $("finalPath").textContent =
                data.path || "No feasible path found.";

            showScreen("results");
            playResultMusic(isSolved);
        }
    };

    $("homeHumanBtn").addEventListener("click", () => {
        openGame();
        window.SmartMazeHuman.start();
    });

    $("homeAiBtn").addEventListener("click", () => {
        openGame();
        window.SmartMazeAI.start();
    });
    $("aiBtn").addEventListener("click", () => {
        window.SmartMazeAI.start();
    });

    $("humanBtn").addEventListener("click", () => {
        window.SmartMazeHuman.start();
    });

    $("resetBtn").addEventListener("click", () => {
        game.resetState();
    });

    $("homeBtn").addEventListener("click", goHome);

    $("playAgainBtn").addEventListener("click", () => {
        openGame();

        if (lastResultMode === "Human Mode") {
            window.SmartMazeHuman.start();
        } else {
            window.SmartMazeAI.start();
        }
    });

    $("backHomeBtn").addEventListener("click", goHome);


    document.addEventListener("keydown", event => {
        if (!$("gameScreen").hidden) {
            window.SmartMazeHuman.handleKey(event);
        }
    });

    game.resetState();
    showScreen("home");
});