
document.addEventListener("DOMContentLoaded", () => {
  const backgroundMusic = document.getElementById("backgroundMusic");
  const clickSound = document.getElementById("clickSound");

  backgroundMusic.volume = 0.30;

  const startMusic = () => {
    backgroundMusic.play().catch(() => {
    
    });
  };

  startMusic();

  document.addEventListener("click", startMusic, { once: true });

 
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button || button.disabled || !clickSound) return;

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  });
});
