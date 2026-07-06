import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Seletores DOM
const video = document.getElementById("bg-video");
const slides = document.querySelectorAll(".text-slide");

// Lerp Variables
let targetTime = 0;
let currentTime = 0;
const easeFactor = 0.06; // Suavização (menor = mais suave/lento, maior = mais reativo)

// Assegura que o autoplay do navegador não interfira no scrubbing
video.pause();

// Loop de atualização do vídeo (Lerp)
function updateVideoScrub() {
  // Interpolação linear em direção ao targetTime
  currentTime += (targetTime - currentTime) * easeFactor;
  
  // Evita pequenas oscilações de ponto flutuante e estouro de limites
  if (Math.abs(targetTime - currentTime) > 0.001 && video.duration) {
    // Limita currentTime entre 0 e um décimo de segundo antes do fim para não quebrar no fim da faixa
    video.currentTime = Math.min(Math.max(currentTime, 0), video.duration - 0.05);
  }
  
  requestAnimationFrame(updateVideoScrub);
}

// Monitora o carregamento do vídeo para obter metadados corretos
video.addEventListener("loadedmetadata", initScrollTrigger);
// Fallback caso os metadados já estejam carregados
if (video.readyState >= 1) {
  initScrollTrigger();
}

function initScrollTrigger() {
  if (!video.duration) return;

  // Inicia o Loop de Renderização
  requestAnimationFrame(updateVideoScrub);

  // 1. ScrollTrigger para o vídeo de fundo
  ScrollTrigger.create({
    trigger: ".scroll-tracker",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.1, // Sincronização básica adicional do GSAP
    onUpdate: (self) => {
      // Multiplica o progresso (0 a 1) pela duração do vídeo
      targetTime = self.progress * video.duration;
    }
  });

  // 2. Timeline GSAP para controlar o fade-in e fade-out de cada Slide de texto
  const textTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: true
    }
  });

  // Nós temos 5 slides. Mapearemos em percentuais exatos do scroll:
  // Slide 1 (Despertar): Ativo de 0% a 15%
  // Slide 2 (Manifesto): Ativo de 20% a 40%
  // Slide 3 (Serviços): Ativo de 45% a 65%
  // Slide 4 (Pilares): Ativo de 70% a 85%
  // Slide 5 (Convite): Ativo de 90% a 100%

  // Definimos uma função de controle para alternar a classe .active dos slides no DOM
  function setActiveSlide(index) {
    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });
  }

  // Vinculamos ganchos na timeline para ligar/desligar slides baseados no scroll
  textTimeline
    // Entrada slide 1 (já começa ativo)
    .call(setActiveSlide, [0], 0.0)
    
    // Transição para o slide 2
    .to({}, { duration: 0.15 }) // espera no slide 1
    .call(setActiveSlide, [1], 0.20)
    
    // Transição para o slide 3
    .to({}, { duration: 0.20 }) // espera no slide 2
    .call(setActiveSlide, [2], 0.45)
    
    // Transição para o slide 4
    .to({}, { duration: 0.20 }) // espera no slide 3
    .call(setActiveSlide, [3], 0.70)
    
    // Transição para o slide 5
    .to({}, { duration: 0.15 }) // espera no slide 4
    .call(setActiveSlide, [4], 0.90)
    .to({}, { duration: 0.10 }); // fim
}

// Tenta tocar o vídeo sem áudio uma vez no início (para contornar autoplay do iOS/Chrome e forçar cache inicial)
window.addEventListener("DOMContentLoaded", () => {
  video.play().then(() => {
    video.pause();
  }).catch(err => {
    console.log("Autoplay policy handle: video initialized in paused scrub state.");
  });
});
