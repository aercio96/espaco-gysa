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
let vantaEffect = null;

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

// Redimensionamento do canvas com lógica 'object-fit: cover' otimizado para performance máxima (60fps)
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

// Inicializa o efeito de nuvens do Vanta.js
function initVanta() {
  if (typeof VANTA !== "undefined" && !vantaEffect) {
    vantaEffect = VANTA.CLOUDS({
      el: "#vanta-bg",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      skyColor: 0xd768d0,
      cloudColor: 0xae599a
    });
  }
}

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
      scrub: 0.5, // Suavização do scroll para uma experiência amanteigada
      onUpdate: (self) => {
        const progress = self.progress;
        // Inicializa dinamicamente o Vanta apenas quando o scroll passa de 70%
        // E destrói o Vanta quando o usuário rola de volta para cima, liberando 100% dos recursos de GPU!
        if (progress >= 0.70) {
          if (!vantaEffect) {
            initVanta();
          }
        } else {
          if (vantaEffect) {
            vantaEffect.destroy();
            vantaEffect = null;
          }
        }
      }
    }
  });

  // Vincula ativação dos indicadores para 6 slides
  mainTimeline.call(setActiveIndicator, [0], 0.0)
              .call(setActiveIndicator, [1], 0.18)
              .call(setActiveIndicator, [2], 0.36)
              .call(setActiveIndicator, [3], 0.56)
              .call(setActiveIndicator, [4], 0.74)
              .call(setActiveIndicator, [5], 0.90);

  // 1. Scrubbing do Vídeo (Sequência de Imagens)
  // O vídeo roda até o final (frame 285) exatamente aos 72% do scroll total,
  // permitindo que a última mulher apareça completamente antes da transição do fundo
  mainTimeline.to(airplay, {
    frame: frameCount - 1,
    snap: "frame", // Garante índices inteiros no array de imagens
    ease: "none",
    duration: 0.72,
    onUpdate: render // Renderiza o frame correspondente a cada atualização
  }, 0);

  // 2. Fades e Movimentos dos Slides de Texto
  // Slide 1 (Despertar) desaparece
  mainTimeline.to("#slide-despertar", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.10)
              .to("#slide-despertar .slide-body", { y: -40, duration: 0.06 }, 0.10);

  // Slide 2 (Manifesto) surge e desaparece
  mainTimeline.to("#slide-manifesto", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.18)
              .to("#slide-manifesto .slide-body", { y: 0, duration: 0.06 }, 0.18)
              .to("#slide-manifesto", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.30)
              .to("#slide-manifesto .slide-body", { y: -40, duration: 0.06 }, 0.30);

  // Slide 3 (Serviços) surge e desaparece (bloco completo surge junto)
  mainTimeline.to("#slide-servicos", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.36)
              .to("#slide-servicos .slide-body", { y: 0, duration: 0.06 }, 0.36)
              .to("#slide-servicos", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.50)
              .to("#slide-servicos .slide-body", { y: -40, duration: 0.06 }, 0.50);

  // Slide 4 (Pilares) surge e desaparece (bloco completo surge junto)
  mainTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.56)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.06 }, 0.56)
              .to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.70)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.06 }, 0.70);

  // Transição do Vídeo para o Vanta.js Clouds background
  mainTimeline.to("#vanta-bg", { opacity: 1, autoAlpha: 1, duration: 0.08 }, 0.72)
              .to(".video-container", { opacity: 0, duration: 0.08 }, 0.72);

  // Slide 5 (Atmosfera Gysa - Nuvem Background) surge e desaparece
  mainTimeline.to("#slide-atmosfera", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.74)
              .to("#slide-atmosfera .slide-body", { y: 0, duration: 0.06 }, 0.74)
              .to("#slide-atmosfera", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.84)
              .to("#slide-atmosfera .slide-body", { y: -40, duration: 0.06 }, 0.84);

  // Slide 6 (Convite/Rodapé - Nuvem Background) surge e permanece ativo
  mainTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.90)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.06 }, 0.90);
}

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
