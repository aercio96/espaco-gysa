import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Seletores DOM
const canvas = document.getElementById("video-canvas");
const context = canvas.getContext("2d");
const slides = document.querySelectorAll(".text-slide");

// Configurações da sequência de frames
const frameCount = 286;
const getFramePath = (index) => `/frames/frame_${index.toString().padStart(4, "0")}.jpg`;

// Pré-carregamento de Imagens
const images = [];
const airplay = { frame: 0 };

let loadedImagesCount = 0;
let isLoaded = false;

// Pré-carrega todas as imagens para evitar flashes pretos durante o scroll
for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = getFramePath(i);
  img.onload = () => {
    loadedImagesCount++;
    if (loadedImagesCount === 1) {
      // Renderiza o primeiro frame imediatamente para evitar tela em branco
      resizeCanvas();
    }
    if (loadedImagesCount === frameCount) {
      isLoaded = true;
      console.log("Todos os frames foram pré-carregados.");
    }
  };
  images.push(img);
}

// Redimensionamento do canvas com lógica 'object-fit: cover'
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function render() {
  const img = images[airplay.frame];
  if (!img || !img.complete) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.width;
  const imgHeight = img.height;

  // Lógica de centralização mantendo proporções (cover)
  const canvasRatio = canvasWidth / canvasHeight;
  const imgRatio = imgWidth / imgHeight;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

window.addEventListener("resize", resizeCanvas);

// --- SISTEMA DE PARTÍCULAS (ATMOSFERA DE POEIRA DE OURO) ---
const particles = [];
const particleCount = 45;

function initParticles() {
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5, // Partículas pequenas e delicadas (0.5px a 2px)
      speedY: Math.random() * 0.15 + 0.05, // Flutuação muito lenta para simular suspensão
      amplitude: Math.random() * 1.0 + 0.2,
      frequency: Math.random() * 0.006 + 0.002,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.35 + 0.15
    });
  }
}

function updateAndDrawParticles(ctx) {
  ctx.save();
  particles.forEach(p => {
    p.angle += p.frequency;
    p.x += Math.sin(p.angle) * 0.1; // Balanço horizontal orgânico
    p.y -= p.speedY; // Subindo lentamente

    // Reinicia no fundo ao sair da tela
    if (p.y < -10) {
      p.y = window.innerHeight + 10;
      p.x = Math.random() * window.innerWidth;
    }
    if (p.x < -10 || p.x > window.innerWidth + 10) {
      p.x = Math.random() * window.innerWidth;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(191, 168, 126, ${p.opacity})`;
    ctx.shadowBlur = 3;
    ctx.shadowColor = "rgba(191, 168, 126, 0.3)";
    ctx.fill();
  });
  ctx.restore();
}

// --- LOOP CONTÍNUO DE RENDERIZAÇÃO (Buttery-smooth 60fps) ---
function startLoop() {
  function loop() {
    drawCanvas();
    requestAnimationFrame(loop);
  }
  loop();
}

function drawCanvas() {
  const img = images[Math.floor(airplay.frame)];
  if (!img || !img.complete) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.width;
  const imgHeight = img.height;

  const canvasRatio = canvasWidth / canvasHeight;
  const imgRatio = imgWidth / imgHeight;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Renderiza as partículas douradas flutuantes por cima do vídeo
  updateAndDrawParticles(context);
}

// --- SISTEMA DE SOM AMBIENTE IMERSIVO (WEB AUDIO API SYNTHESIZER) ---
let audioCtx = null;
let soundStarted = false;
let droneNode = null;
let droneNode2 = null;
let filterNode = null;
let masterGain = null;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Volume master
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.0, audioCtx.currentTime);

  // Filtro passa-baixa para som aveludado e relaxante
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.Q.setValueAtTime(0.8, audioCtx.currentTime);
  filterNode.frequency.setValueAtTime(200, audioCtx.currentTime);

  // LFO oscilante lento para criar efeito de "respiração/ondas" no som
  const lfo = audioCtx.createOscillator();
  lfo.frequency.setValueAtTime(0.06, audioCtx.currentTime); // 16 segundos por ciclo completo
  
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(65, audioCtx.currentTime); // Varia de 135Hz a 265Hz
  
  lfo.connect(lfoGain);
  lfoGain.connect(filterNode.frequency);
  lfo.start();

  // Oscilador 1: Tom base quente e relaxante (Dó sustenido grave a 69.3Hz)
  droneNode = audioCtx.createOscillator();
  droneNode.type = 'sine';
  droneNode.frequency.setValueAtTime(69.296, audioCtx.currentTime); // C#2
  
  // Oscilador 2: Tom harmônico de quinta (Sol sustenido a 103.8Hz)
  droneNode2 = audioCtx.createOscillator();
  droneNode2.type = 'triangle';
  droneNode2.frequency.setValueAtTime(103.826, audioCtx.currentTime); // G#2
  
  const oscGain1 = audioCtx.createGain();
  const oscGain2 = audioCtx.createGain();
  
  oscGain1.gain.setValueAtTime(0.35, audioCtx.currentTime);
  oscGain2.gain.setValueAtTime(0.12, audioCtx.currentTime); // Mais baixo para não distorcer

  droneNode.connect(oscGain1);
  droneNode2.connect(oscGain2);
  
  oscGain1.connect(filterNode);
  oscGain2.connect(filterNode);
  
  filterNode.connect(masterGain);
  masterGain.connect(audioCtx.destination);
  
  droneNode.start();
  droneNode2.start();
}

function toggleAudio() {
  const toggleBtn = document.getElementById("audio-toggle");
  
  if (!audioCtx) {
    initAudio();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  if (!soundStarted) {
    // Fade in suave de som
    masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 3.0);
    toggleBtn.classList.add("playing");
    toggleBtn.querySelector(".audio-text").innerText = "MUTE";
    soundStarted = true;
  } else {
    // Fade out suave de som
    masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 1.5);
    toggleBtn.classList.remove("playing");
    toggleBtn.querySelector(".audio-text").innerText = "AUDIO";
    soundStarted = false;
  }
}

// Inicializa as animações
function initAnimations() {
  resizeCanvas();
  initParticles();
  startLoop();

  // Ouvinte de clique para ativar/desativar áudio ambiente
  const audioBtn = document.getElementById("audio-toggle");
  if (audioBtn) {
    audioBtn.addEventListener("click", toggleAudio);
  }

  // Configuração inicial de estado dos slides e slide-bodies
  gsap.set(".text-slide", { opacity: 0, autoAlpha: 0, pointerEvents: "none" });
  gsap.set(".text-slide .slide-body", { y: 40 });
  
  // Define o Slide 1 (Despertar) como ativo no início
  gsap.set("#slide-despertar", { opacity: 1, autoAlpha: 1, pointerEvents: "auto" });
  gsap.set("#slide-despertar .slide-body", { y: 0 });

  // Estados iniciais individuais dos cards para animação de revelação por scroll
  gsap.set(".service-card", { opacity: 0, y: 50 });
  gsap.set(".pilar-card", { opacity: 0, y: 50 });

  // Controle dos indicadores da barra lateral
  const indicators = document.querySelectorAll(".indicator-step");
  function setActiveIndicator(index) {
    indicators.forEach((ind, idx) => {
      if (idx === index) {
        ind.classList.add("active");
      } else {
        ind.classList.remove("active");
      }
    });
  }

  // Timeline unificada para controlar a sequência de frames e fades de texto
  const mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5 // Suavização do scroll para uma experiência amanteigada
    }
  });

  // Vincula ativação dos indicadores
  mainTimeline.call(setActiveIndicator, [0], 0.0)
              .call(setActiveIndicator, [1], 0.22)
              .call(setActiveIndicator, [2], 0.48)
              .call(setActiveIndicator, [3], 0.75)
              .call(setActiveIndicator, [4], 0.94);

  // 1. Scrubbing do Vídeo (Sequência de Imagens)
  mainTimeline.to(airplay, {
    frame: frameCount - 1,
    snap: "frame", // Garante índices inteiros no array de imagens
    ease: "none",
    duration: 1
  }, 0);

  // 2. Fades e Movimentos dos Slides de Texto
  // Slide 1 (Despertar) desaparece
  mainTimeline.to("#slide-despertar", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.12)
              .to("#slide-despertar .slide-body", { y: -40, duration: 0.15 }, 0.12);

  // Slide 2 (Manifesto) surge e desaparece
  mainTimeline.to("#slide-manifesto", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.22)
              .to("#slide-manifesto .slide-body", { y: 0, duration: 0.15 }, 0.22)
              .to("#slide-manifesto", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.38)
              .to("#slide-manifesto .slide-body", { y: -40, duration: 0.15 }, 0.38);

  // Slide 3 (Serviços) surge e desaparece
  mainTimeline.to("#slide-servicos", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.1 }, 0.48)
              .to("#slide-servicos .slide-body", { y: 0, duration: 0.1 }, 0.48);

  // Revelação sequencial (stagger) dos cards de serviço via scroll
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card, i) => {
    const startOffset = 0.49 + (i * 0.04); // Stagger progressivo
    mainTimeline.to(card, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, startOffset);
  });

  mainTimeline.to("#slide-servicos", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.1 }, 0.67)
              .to("#slide-servicos .slide-body", { y: -40, duration: 0.1 }, 0.67);

  // Slide 4 (Pilares) surge e desaparece
  mainTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.1 }, 0.75)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.1 }, 0.75);

  // Revelação sequencial (stagger) dos cards de pilares via scroll
  const pilarCards = document.querySelectorAll(".pilar-card");
  pilarCards.forEach((card, i) => {
    const startOffset = 0.76 + (i * 0.04); // Stagger progressivo
    mainTimeline.to(card, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, startOffset);
  });

  mainTimeline.to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.1 }, 0.89)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.1 }, 0.89);

  // Slide 5 (Convite/Rodapé) surge e permanece ativo
  mainTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.94)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.15 }, 0.94);
}

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
