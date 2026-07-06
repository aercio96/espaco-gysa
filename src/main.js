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

// Inicializa as animações
function initAnimations() {
  // Ajusta o tamanho inicial do canvas
  resizeCanvas();

  // Configuração inicial de estado dos slides e slide-bodies
  gsap.set(".text-slide", { opacity: 0, autoAlpha: 0, pointerEvents: "none" });
  gsap.set(".text-slide .slide-body", { y: 40 });
  
  // Define o Slide 1 (Despertar) como ativo no início
  gsap.set("#slide-despertar", { opacity: 1, autoAlpha: 1, pointerEvents: "auto" });
  gsap.set("#slide-despertar .slide-body", { y: 0 });

  // Timeline unificada para controlar a sequência de frames e fades de texto
  const mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5 // Suavização do scroll para uma experiência amanteigada
    }
  });

  // 1. Scrubbing do Vídeo (Sequência de Imagens)
  mainTimeline.to(airplay, {
    frame: frameCount - 1,
    snap: "frame", // Garante índices inteiros no array de imagens
    ease: "none",
    duration: 1,
    onUpdate: render // Renderiza o frame correspondente a cada atualização
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
  mainTimeline.to("#slide-servicos", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.48)
              .to("#slide-servicos .slide-body", { y: 0, duration: 0.15 }, 0.48)
              .to("#slide-servicos", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.65)
              .to("#slide-servicos .slide-body", { y: -40, duration: 0.15 }, 0.65);

  // Slide 4 (Pilares) surge e desaparece
  mainTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.75)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.15 }, 0.75)
              .to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.88)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.15 }, 0.88);

  // Slide 5 (Convite/Rodapé) surge e permanece ativo
  mainTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.94)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.15 }, 0.94);
}

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
