const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const gameStatus = document.getElementById("gameStatus");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");
const gameCard = document.querySelector(".game-card");
const finalScore = document.getElementById("finalScore");
const bestScoreEl = document.getElementById("bestScore");
const leaderboardRows = document.getElementById("leaderboardRows");
const scoreForm = document.getElementById("scoreForm");
const playerName = document.getElementById("playerName");
const formMessage = document.getElementById("formMessage");

const W = canvas.width, H = canvas.height;
const groundH = 65, birdX = 100, birdR = 14;
let bird, pipes, particles, score, best = Number(localStorage.getItem("birdBest") || 0);
let state = "ready", frame = 0, lastTime = 0, animationId;
let soundEnabled = false, audioContext;
bestScoreEl.textContent = best;

function updateGameControls() {
  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  gameStatus.textContent = isPlaying ? "FLYING" : isPaused ? "PAUSED" : state === "over" ? "FLIGHT ENDED" : "READY";
  pauseBtn.disabled = state !== "playing" && !isPaused;
  pauseBtn.textContent = isPaused ? "▶ RESUME" : "Ⅱ PAUSE";
  pauseBtn.setAttribute("aria-label", isPaused ? "Resume flight" : "Pause flight");
}

function resetGame() {
  bird = { y: H * .43, vy: 0, wingKick: 0 };
  pipes = [];
  particles = [];
  score = 0;
  frame = 0;
  finalScore.textContent = "0";
  addPipe(W + 30);
}
function addPipe(x) {
  const gap = 154;
  const top = 75 + Math.random() * (H - groundH - gap - 150);
  pipes.push({ x, top, gap, passed: false });
}
function flap() {
  if (state === "paused") {
    resumeGame();
    return;
  }
  if (state === "ready" || state === "over") startGame();
  if (state === "playing") {
    bird.vy = -5.7;
    bird.wingKick = 1;
    emitParticles(birdX - 12, bird.y + 5, 5, "#ffffff");
    playTone(620, .055, "sine");
  }
}
function startGame() {
  resetGame();
  state = "playing";
  overlay.classList.add("hidden");
  bird.vy = -5.7;
  updateGameControls();
}
function pauseGame() {
  if (state !== "playing") return;
  state = "paused";
  overlayTitle.textContent = "Take a breather";
  overlayText.textContent = "Your flight is paused. Resume whenever you are ready.";
  startBtn.innerHTML = 'RESUME FLIGHT <span>▶</span>';
  overlay.classList.remove("hidden");
  updateGameControls();
}
function resumeGame() {
  if (state !== "paused") return;
  state = "playing";
  overlay.classList.add("hidden");
  updateGameControls();
}
function endGame() {
  if (state !== "playing") return;
  state = "over";
  emitParticles(birdX, bird.y, 20, "#ffd166");
  playTone(180, .24, "triangle");
  finalScore.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem("birdBest", String(best));
    bestScoreEl.textContent = best;
  }
  overlayTitle.textContent = "Flight complete!";
  overlayText.textContent = `You scored ${score} point${score === 1 ? "" : "s"}. Ready to try again?`;
  startBtn.innerHTML = 'FLY AGAIN <span>↗</span>';
  overlay.classList.remove("hidden");
  updateGameControls();
}
function playTone(frequency, duration, type) {
  if (!soundEnabled || !audioContext || audioContext.state !== "running") return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.07, now + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
async function toggleSound() {
  if (!soundEnabled) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      soundBtn.textContent = "♫ SOUND N/A";
      soundBtn.disabled = true;
      gameStatus.textContent = "SOUND NOT SUPPORTED";
      return;
    }
    try {
      audioContext = audioContext || new AudioContextClass();
      await audioContext.resume();
      soundEnabled = true;
    } catch (error) {
      console.error("Unable to enable game audio.", error);
      gameStatus.textContent = "SOUND UNAVAILABLE";
      return;
    }
  } else {
    soundEnabled = false;
  }
  soundBtn.textContent = soundEnabled ? "♫ SOUND ON" : "♫ SOUND OFF";
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
  soundBtn.setAttribute("aria-label", soundEnabled ? "Turn sound effects off" : "Turn sound effects on");
}
function emitParticles(x, y, amount, color) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 18 + Math.random() * 14,
      size: 2 + Math.random() * 3,
      color
    });
  }
}
function drawParticles(dt) {
  particles = particles.filter((particle) => particle.life > 0);
  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 0.035 * dt;
    particle.life -= dt;
    ctx.globalAlpha = Math.min(1, particle.life / 12);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8ed7ff"); sky.addColorStop(1, "#e2f7ff");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const sun = ctx.createRadialGradient(326, 82, 8, 326, 82, 65);
  sun.addColorStop(0, "#fff9ce99"); sun.addColorStop(1, "#fff9ce00");
  ctx.fillStyle = sun; ctx.fillRect(250, 6, 150, 150);
  // Soft clouds
  ctx.fillStyle = "#ffffff99";
  for (let i=0;i<4;i++) {
    const x = ((i*137 - frame*.25) % (W+100) + W+100) % (W+100) - 40;
    const y = 65 + (i%3)*67;
    ctx.beginPath(); ctx.ellipse(x,y,28,11,0,0,Math.PI*2); ctx.ellipse(x+18,y-8,20,14,0,0,Math.PI*2); ctx.ellipse(x+35,y,25,10,0,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle="#83cda2";ctx.beginPath();ctx.moveTo(0,H-groundH-40);ctx.quadraticCurveTo(90,H-groundH-120,180,H-groundH-42);ctx.quadraticCurveTo(290,H-groundH-140,W,H-groundH-40);ctx.lineTo(W,H-groundH);ctx.lineTo(0,H-groundH);ctx.fill();
}
function drawPipe(p) {
  const bottomY = p.top + p.gap;
  ctx.fillStyle="#27a96b";ctx.strokeStyle="#137a4b";ctx.lineWidth=3;
  ctx.fillRect(p.x,0,54,p.top);ctx.strokeRect(p.x,0,54,p.top);
  ctx.fillRect(p.x-5,p.top-20,64,20);ctx.strokeRect(p.x-5,p.top-20,64,20);
  ctx.fillRect(p.x,bottomY,54,H-groundH-bottomY);ctx.strokeRect(p.x,bottomY,54,H-groundH-bottomY);
  ctx.fillRect(p.x-5,bottomY,64,20);ctx.strokeRect(p.x-5,bottomY,64,20);
  ctx.fillStyle="#ffffff30";ctx.fillRect(p.x+9,0,7,p.top-20);ctx.fillRect(p.x+9,bottomY+20,7,H-groundH-bottomY-20);
}
function drawBird() {
  const wingBeat = Math.sin(frame * .38) * .48;
  const wingAngle = wingBeat - bird.wingKick * .8;
  const bodyTilt = Math.max(-.38, Math.min(.62, bird.vy * .055));

  ctx.save();
  ctx.translate(birdX, bird.y);
  ctx.rotate(bodyTilt);

  const tail = ctx.createLinearGradient(-26, -3, -9, 5);
  tail.addColorStop(0, "#74482d");
  tail.addColorStop(1, "#a96c3c");
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.quadraticCurveTo(-23, -12, -31, -13);
  ctx.quadraticCurveTo(-27, -5, -32, 1);
  ctx.quadraticCurveTo(-22, 0, -14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#70452e";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.strokeStyle = "#8b603d";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const footX of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(footX, 10);
    ctx.lineTo(footX - 1, 16);
    ctx.lineTo(footX - 5, 18);
    ctx.moveTo(footX - 1, 16);
    ctx.lineTo(footX + 3, 18);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(-4, -3);
  ctx.rotate(wingAngle);
  const farWing = ctx.createLinearGradient(-20, -18, 5, 5);
  farWing.addColorStop(0, "#765036");
  farWing.addColorStop(1, "#a77a4c");
  ctx.fillStyle = farWing;
  ctx.beginPath();
  ctx.moveTo(5, 3);
  ctx.quadraticCurveTo(-4, -7, -15, -20);
  ctx.quadraticCurveTo(-12, -10, -22, -14);
  ctx.quadraticCurveTo(-17, -5, -18, 0);
  ctx.quadraticCurveTo(-10, 7, 5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#68462f";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  for (let feather = 0; feather < 4; feather++) {
    ctx.beginPath();
    ctx.moveTo(-1, 2 + feather);
    ctx.quadraticCurveTo(-9 - feather, -5, -14 - feather * 2, -12 + feather * 2);
    ctx.stroke();
  }
  ctx.restore();

  const body = ctx.createLinearGradient(-12, -12, 13, 12);
  body.addColorStop(0, "#c78a4e");
  body.addColorStop(.55, "#b7773e");
  body.addColorStop(1, "#8b512f");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-1, 1, 18, 13, -.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#70452e";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#e3c69a";
  ctx.beginPath();
  ctx.ellipse(1, 6, 10, 7, -.12, .15, Math.PI * .92);
  ctx.fill();

  ctx.save();
  ctx.translate(-3, -3);
  ctx.rotate(wingAngle);
  const nearWing = ctx.createLinearGradient(-17, -20, 6, 7);
  nearWing.addColorStop(0, "#bc8550");
  nearWing.addColorStop(.6, "#a66e40");
  nearWing.addColorStop(1, "#805032");
  ctx.fillStyle = nearWing;
  ctx.beginPath();
  ctx.moveTo(7, 4);
  ctx.quadraticCurveTo(-1, -5, -14, -19);
  ctx.quadraticCurveTo(-11, -11, -21, -13);
  ctx.quadraticCurveTo(-16, -6, -19, 1);
  ctx.quadraticCurveTo(-9, 9, 7, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#70472f";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "#d7ad78";
  ctx.lineWidth = 1;
  for (let feather = 0; feather < 5; feather++) {
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.quadraticCurveTo(-6 - feather, -2, -12 - feather * 2, -11 + feather * 2);
    ctx.stroke();
  }
  ctx.restore();

  const head = ctx.createRadialGradient(8, -11, 1, 7, -8, 12);
  head.addColorStop(0, "#d7a066");
  head.addColorStop(1, "#9a6037");
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(8, -8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#70452e";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "#f0dfbd";
  ctx.beginPath();
  ctx.ellipse(10, -3, 5.5, 3, .2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8a342";
  ctx.beginPath();
  ctx.moveTo(16, -7);
  ctx.lineTo(27, -4);
  ctx.lineTo(16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#9a6037";
  ctx.lineWidth = 1;
  ctx.stroke();

  const blinking = frame % 210 > 202;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(11, -11, 4, blinking ? 1 : 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!blinking) {
    ctx.fillStyle = "#172d35";
    ctx.beginPath();
    ctx.arc(12, -11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(12.7, -11.8, .7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#4d3528";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(7, -11);
    ctx.lineTo(15, -11);
    ctx.stroke();
  }

  ctx.restore();
}
function drawGround() {
  ctx.fillStyle="#d5b979";ctx.fillRect(0,H-groundH,W,groundH);
  ctx.fillStyle="#61c66f";ctx.fillRect(0,H-groundH,W,12);
  ctx.fillStyle="#b99b5f";
  for(let x=-(frame*2%30);x<W;x+=30){ctx.fillRect(x,H-groundH+23,16,4);ctx.fillRect(x+10,H-groundH+42,14,4);}
}
function drawScore() {
  ctx.font="bold 36px 'Space Grotesk', Arial";ctx.textAlign="center";ctx.lineWidth=5;ctx.strokeStyle="#15365055";ctx.strokeText(score,W/2,55);ctx.fillStyle="#fff";ctx.fillText(score,W/2,55);
}
function tick(time=0) {
  const dt = Math.min((time-lastTime)/16.67 || 1, 2); lastTime=time;
  if (state !== "paused") frame++;
  drawBackground();
  if (state === "playing") {
    bird.vy += .29*dt; bird.y += bird.vy*dt;
    bird.wingKick = Math.max(0, bird.wingKick - .12 * dt);
    for (const p of pipes) {
      p.x -= 2.65*dt;
      if (!p.passed && p.x+54 < birdX) {
        p.passed=true;
        score++;
        finalScore.textContent=score;
        emitParticles(W / 2, 60, 8, "#ffe27a");
        playTone(880, .12, "sine");
      }
      const hitX = birdX+birdR-3 > p.x && birdX-birdR+3 < p.x+54;
      if (hitX && (bird.y-birdR+3 < p.top || bird.y+birdR-3 > p.top+p.gap)) endGame();
    }
    if (pipes[pipes.length-1].x < W-205) addPipe(W+20);
    pipes = pipes.filter(p=>p.x>-70);
    if (bird.y-birdR < 0 || bird.y+birdR > H-groundH) endGame();
  } else if (state === "ready") {
    bird.y = H*.43 + Math.sin(frame*.07)*6;
  }
  if (state !== "paused") drawParticles(dt);
  pipes.forEach(drawPipe);
  drawGround(); drawBird();
  if (state === "playing") drawScore();
  animationId = requestAnimationFrame(tick);
}
startBtn.addEventListener("click", () => {
  if (state === "paused") resumeGame();
  else startGame();
});
pauseBtn.addEventListener("click", () => {
  if (state === "paused") resumeGame();
  else pauseGame();
});
restartBtn.addEventListener("click", startGame);
soundBtn.addEventListener("click", toggleSound);
function syncFullscreenButton() {
  const isFullscreen = document.fullscreenElement === gameCard;
  fullscreenBtn.textContent = isFullscreen ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN";
  fullscreenBtn.setAttribute("aria-label", isFullscreen ? "Exit fullscreen game" : "Enter fullscreen game");
}
fullscreenBtn.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === gameCard) {
      await document.exitFullscreen();
    } else if (!document.fullscreenElement) {
      await gameCard.requestFullscreen();
    } else {
      await document.exitFullscreen();
      await gameCard.requestFullscreen();
    }
  } catch (error) {
    gameStatus.textContent = "FULLSCREEN UNAVAILABLE";
    window.setTimeout(() => {
      gameStatus.textContent = state === "playing" ? "FLYING" : state === "over" ? "FLIGHT ENDED" : "READY";
    }, 2500);
    console.error("Unable to change fullscreen mode.", error);
  }
});
document.addEventListener("fullscreenchange", syncFullscreenButton);
canvas.addEventListener("pointerdown", (e)=>{e.preventDefault();flap();});
document.addEventListener("keydown",(e)=>{
  if (e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))) return;
  if(e.code==="KeyP"){e.preventDefault();if(state==="playing")pauseGame();else if(state==="paused")resumeGame();return;}
  if(e.code==="Space" || e.code==="ArrowUp"){e.preventDefault();flap();}
  if(e.code==="Enter" && state==="over")startGame();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});

async function loadLeaderboard() {
  try {
    const response = await fetch("/api/scores");
    if (!response.ok) throw new Error("Unable to load scores");
    const scores = await response.json();
    if (!scores.length) { leaderboardRows.innerHTML='<p class="muted">No scores yet — be the first high flyer!</p>'; return; }
    leaderboardRows.innerHTML = scores.map((s,i)=>`
      <div class="score-row">
        <span class="rank ${i===0?'first':''}">${String(i+1).padStart(2,'0')}</span>
        <span class="player">${escapeHtml(s.player_name)}</span>
        <span class="points">${s.score} PTS</span>
      </div>`).join("");
  } catch {
    leaderboardRows.innerHTML='<p class="muted">Leaderboard is unavailable. Start the FastAPI server to enable saving.</p>';
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
scoreForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = playerName.value.trim();
  const scoreValue = Number(finalScore.textContent);
  if (!name) { formMessage.textContent="Please enter a player name."; return; }
  formMessage.textContent="Saving score…";
  try {
    const response = await fetch("/api/scores", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({player_name:name,score:scoreValue})
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Could not save score.");
    formMessage.textContent="Score saved — nice flight!";
    await loadLeaderboard();
  } catch (err) { formMessage.textContent=err.message || "Could not save score. Is the server running?"; }
});
resetGame();
updateGameControls();
tick();
loadLeaderboard();
