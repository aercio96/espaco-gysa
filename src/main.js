import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const video = document.getElementById("bg-video");
const slides = document.querySelectorAll(".text-slide");

// State variables for video Lerp scrubbing
let targetTime = 0;
let currentTime = 0;
const easeFactor = 0.05; // Suavização refinada para seek de vídeo mais fluido

// Initial pause to prevent autoplay interference
video.pause();

// Lerp update loop running on requestAnimationFrame
function updateVideoScrub() {
  if (video.duration) {
    currentTime += (targetTime - currentTime) * easeFactor;
    
    // Evita oscilação de ponto flutuante e estouro de limites
    if (Math.abs(targetTime - currentTime) > 0.001) {
      video.currentTime = Math.min(Math.max(currentTime, 0), video.duration - 0.05);
    }
  }
  requestAnimationFrame(updateVideoScrub);
}

let isInitialized = false;
function initScrollTrigger() {
  if (isInitialized) return;
  if (!video.duration) return;
  isInitialized = true;

  // Inicia o Loop de Renderização
  requestAnimationFrame(updateVideoScrub);

  // 1. ScrollTrigger para conduzir a propriedade targetTime do vídeo
  ScrollTrigger.create({
    trigger: ".scroll-tracker",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      targetTime = self.progress * video.duration;
    }
  });

  // Configuração inicial de estado dos slides e slide-bodies via GSAP
  gsap.set(".text-slide", { opacity: 0, autoAlpha: 0, pointerEvents: "none" });
  gsap.set(".text-slide .slide-body", { y: 40 });
  
  // Define o Slide 1 (Despertar) como ativo no início
  gsap.set("#slide-despertar", { opacity: 1, autoAlpha: 1, pointerEvents: "auto" });
  gsap.set("#slide-despertar .slide-body", { y: 0 });

  // 2. Timeline unificada para controlar fades e transições de posição de forma fluida
  const textTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: 1 // Suavização da timeline para transições fluidas de texto
    }
  });

  // Slide 1 (Despertar) desaparece
  textTimeline.to("#slide-despertar", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.12)
              .to("#slide-despertar .slide-body", { y: -40, duration: 0.15 }, 0.12);

  // Slide 2 (Manifesto) surge e desaparece
  textTimeline.to("#slide-manifesto", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.22)
              .to("#slide-manifesto .slide-body", { y: 0, duration: 0.15 }, 0.22)
              .to("#slide-manifesto", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.38)
              .to("#slide-manifesto .slide-body", { y: -40, duration: 0.15 }, 0.38);

  // Slide 3 (Serviços) surge e desaparece
  textTimeline.to("#slide-servicos", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.48)
              .to("#slide-servicos .slide-body", { y: 0, duration: 0.15 }, 0.48)
              .to("#slide-servicos", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.65)
              .to("#slide-servicos .slide-body", { y: -40, duration: 0.15 }, 0.65);

  // Slide 4 (Pilares) surge e desaparece
  textTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.75)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.15 }, 0.75)
              .to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.15 }, 0.88)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.15 }, 0.88);

  // Slide 5 (Convite/Rodapé) surge e permanece
  textTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.15 }, 0.94)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.15 }, 0.94);
}

// Listeners para iniciar o script de forma segura e única
video.addEventListener("loadedmetadata", initScrollTrigger);
if (video.readyState >= 1) {
  initScrollTrigger();
}

// Buffer de inicialização para navegadores
window.addEventListener("DOMContentLoaded", () => {
  video.play().then(() => {
    video.pause();
  }).catch(err => {
    console.log("Autoplay restrictions bypassed: waiting for user scroll.");
  });
});
