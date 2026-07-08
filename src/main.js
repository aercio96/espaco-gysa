import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Seletores DOM
const canvas = document.getElementById("video-canvas");
const context = canvas.getContext("2d");
const slides = document.querySelectorAll(".text-slide");
context.imageSmoothingEnabled = true;
context.imageSmoothingQuality = "high";

// Configurações da sequência de frames
const frameCount = 286;
const getFramePath = (index) => `/frames/frame_${index.toString().padStart(4, "0")}.jpg`;

// Pré-carregamento de Imagens
const images = new Array(frameCount);
const frameLoadState = new Array(frameCount).fill("idle");
const airplay = { frame: 0 };
const initialFramePreload = 48;
const framePreloadBatchSize = 32;
const framePreloadConcurrency = 8;
const frameLookAhead = 12;

let loadedImagesCount = 0;
let isLoaded = false;
let activeFrameLoads = 0;
let nextSequentialFrame = 0;
let renderScheduled = false;
let vantaEffect = null;
const frameLoadQueue = [];

const scheduleIdleWork = (callback) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 500 });
  } else {
    window.setTimeout(callback, 16);
  }
};

function scheduleFrameLoad(frameIndex, priority = false) {
  if (frameIndex < 0 || frameIndex >= frameCount || frameLoadState[frameIndex] !== "idle") return;

  frameLoadState[frameIndex] = "queued";
  if (priority) {
    frameLoadQueue.unshift(frameIndex);
  } else {
    frameLoadQueue.push(frameIndex);
  }
  pumpFrameQueue();
}

function scheduleSequentialFrames(count) {
  const endFrame = Math.min(nextSequentialFrame + count, frameCount);
  while (nextSequentialFrame < endFrame) {
    scheduleFrameLoad(nextSequentialFrame);
    nextSequentialFrame++;
  }
}

function scheduleRemainingFrames() {
  scheduleSequentialFrames(framePreloadBatchSize);
  if (nextSequentialFrame < frameCount) {
    scheduleIdleWork(scheduleRemainingFrames);
  }
}

function prioritizeNearbyFrames(frameIndex) {
  const centerFrame = Math.round(frameIndex);
  for (let offset = frameLookAhead; offset >= 0; offset--) {
    scheduleFrameLoad(centerFrame - offset, true);
    scheduleFrameLoad(centerFrame + offset, true);
  }
}

function pumpFrameQueue() {
  while (activeFrameLoads < framePreloadConcurrency && frameLoadQueue.length) {
    const frameIndex = frameLoadQueue.shift();
    if (frameLoadState[frameIndex] !== "queued") continue;

    activeFrameLoads++;
    loadFrame(frameIndex);
  }
}

function loadFrame(frameIndex) {
  const img = new Image();
  let settled = false;
  frameLoadState[frameIndex] = "loading";
  images[frameIndex] = img;
  img.decoding = "async";
  if ("fetchPriority" in img) {
    img.fetchPriority = frameIndex < initialFramePreload ? "high" : "low";
  }

  const markReady = () => {
    if (settled) return;
    settled = true;
    frameLoadState[frameIndex] = "loaded";
    activeFrameLoads--;
    loadedImagesCount++;
    if (frameIndex === 0) {
      resizeCanvas();
    } else if (frameIndex === Math.round(airplay.frame)) {
      requestRender();
    }
    if (loadedImagesCount === frameCount) {
      isLoaded = true;
      console.log("Todos os frames foram pré-carregados e decodificados.");
    }
    pumpFrameQueue();
  };

  img.src = getFramePath(frameIndex + 1);

  if (img.decode) {
    img.decode().then(markReady).catch(markReady);
  } else {
    img.onload = markReady;
    img.onerror = markReady;
  }
}

scheduleSequentialFrames(initialFramePreload);
scheduleIdleWork(scheduleRemainingFrames);

// Redimensionamento do canvas com lógica 'object-fit: cover' otimizado para performance máxima (60fps)
function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(window.innerWidth * pixelRatio);
  canvas.height = Math.round(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  lastRenderedFrame = -1; // Força re-renderização imediata
  requestRender();
}

let lastRenderedFrame = -1;

function requestRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

function render() {
  const currentFrame = Math.round(airplay.frame);
  if (currentFrame === lastRenderedFrame) return;

  const img = images[currentFrame];
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

  // Removido clearRect pois o formato cover preenche todo o espaço, poupando a GPU
  context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  lastRenderedFrame = currentFrame;
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
      skyColor: 0x2b1a20,      /* Cinza-ameixa escuro com subtom rosa quente */
      cloudColor: 0xa65170,    /* Rosa musa / rosa queimado oficial (Combina com o primeiro bloco) */
      sunColor: 0xbfa87e,      /* Dourado champanhe */
      sunGlareColor: 0xa65170, /* Brilho solar em tom rosa musa */
      sunlightColor: 0xbfa87e  /* Luz dourada suave */
    });
  }
}

// Inicializa as animações
function initAnimations() {
  // Inicializa o background tridimensional Vanta Clouds de uma vez
  // Isso compila os shaders, mas vamos pausá-lo imediatamente para não consumir GPU durante o vídeo
  initVanta();
  if (vantaEffect && vantaEffect.req) {
    cancelAnimationFrame(vantaEffect.req);
    vantaEffect.req = null;
  }

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
  const sceneButtons = document.querySelectorAll(".scene-toggle-btn");
  const menuToggle = document.querySelector(".menu-toggle-btn");
  const sideMenu = document.getElementById("side-menu");
  const sceneProgressMap = [0, 0.16, 0.31, 0.49, 0.65, 0.83, 0.95];

  window.toggleSideMenu = function toggleSideMenu(open = true) {
    document.body.classList.toggle("side-menu-open", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
    sideMenu?.setAttribute("aria-hidden", String(!open));
  };

  window.scrollToScene = function scrollToScene(index, event) {
    event?.preventDefault();
    window.toggleSideMenu?.(false);
    const targetProgress = sceneProgressMap[index] ?? 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: Math.max(0, maxScroll * targetProgress),
      behavior: "smooth"
    });
  };

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      window.toggleSideMenu?.(false);
    }
  });

  function setActiveIndicator(index) {
    indicators.forEach((ind, idx) => {
      if (idx === index) {
        ind.classList.add("active");
      } else {
        ind.classList.remove("active");
      }
    });

    sceneButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.scene) === index);
    });
  }

  const hoverRescueSlides = [
    { element: document.getElementById("slide-despertar"), start: 0.00, end: 0.15 },
    { element: document.getElementById("slide-manifesto"), start: 0.15, end: 0.29 },
    { element: document.getElementById("slide-sobre"), start: 0.29, end: 0.47 },
    { element: document.getElementById("slide-pilares"), start: 0.47, end: 0.62 },
    { element: document.getElementById("slide-atmosfera"), start: 0.60, end: 0.75 },
    { element: document.getElementById("slide-galeria"), start: 0.75, end: 0.90 },
    { element: document.getElementById("slide-convite"), start: 0.90, end: 1.00 }
  ].filter(({ element }) => Boolean(element));

  hoverRescueSlides.forEach(({ element }) => {
    const rescueTarget = element.querySelector(".slide-body") || element;

    rescueTarget.addEventListener("mouseenter", () => {
      element.classList.add("is-hover-rescued");
    });

    rescueTarget.addEventListener("mouseleave", () => {
      element.classList.remove("is-hover-rescued");
    });

    rescueTarget.addEventListener("focusin", () => {
      element.classList.add("is-hover-rescued");
    });

    rescueTarget.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!rescueTarget.contains(document.activeElement)) {
          element.classList.remove("is-hover-rescued");
        }
      });
    });
  });

  function updateHoverRescueCandidates(progress) {
    hoverRescueSlides.forEach(({ element, start, end }) => {
      const isCandidate = progress >= start && progress <= end;
      element.classList.toggle("hover-rescue-candidate", isCandidate);

      if (!isCandidate) {
        element.classList.remove("is-hover-rescued");
      }
    });
  }

  const whatsappPrompt = document.querySelector(".hero-whatsapp-popover");
  const servicesSlideStart = 0.60;

  function updateWhatsAppPromptVisibility(progress) {
    whatsappPrompt?.classList.toggle("is-hidden-after-services", progress >= servicesSlideStart);
  }

  document.querySelectorAll(".sobre-card, .pilar-card").forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  // Timeline unificada para controlar a sequência de frames e fades de texto
  const mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.68 // Suavização do scroll para uma experiência mais fluida
    }
  });

  // Controla dinamicamente a execução do WebGL do Vanta de acordo com o progresso do Scroll
  mainTimeline.eventCallback("onUpdate", () => {
    const progress = mainTimeline.progress();
    updateHoverRescueCandidates(progress);
    updateWhatsAppPromptVisibility(progress);

    if (progress >= 0.50) {
      if (vantaEffect && !vantaEffect.req) {
        vantaEffect.animationLoop();
      }
    } else {
      if (vantaEffect && vantaEffect.req) {
        cancelAnimationFrame(vantaEffect.req);
        vantaEffect.req = null;
      }
    }
  });
  updateHoverRescueCandidates(0);
  updateWhatsAppPromptVisibility(0);

  // Vincula ativação dos indicadores para 7 slides
  mainTimeline.call(setActiveIndicator, [0], 0.0)
              .call(setActiveIndicator, [1], 0.15)
              .call(setActiveIndicator, [2], 0.29)
              .call(setActiveIndicator, [3], 0.47)
              .call(setActiveIndicator, [4], 0.60)
              .call(setActiveIndicator, [5], 0.75)
              .call(setActiveIndicator, [6], 0.90);

  // 1. Scrubbing do Vídeo (Sequência de Imagens)
  // O vídeo roda até o final (frame 285) mais rápido para liberar o fundo de nuvens
  mainTimeline.to(airplay, {
    frame: frameCount - 1,
    snap: "frame", // Garante índices inteiros no array de imagens
    ease: "none",
    duration: 0.60,
    onUpdate: () => {
      prioritizeNearbyFrames(airplay.frame);
      requestRender();
    } // Renderiza o frame correspondente a cada atualização
  }, 0);

  // 2. Fades e Movimentos dos Slides de Texto
  // Slide 1 (Despertar) desaparece
  mainTimeline.to("#slide-despertar", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.09)
              .to("#slide-despertar .slide-body", { y: -40, duration: 0.06 }, 0.09);

  // Slide 2 (Manifesto) surge e desaparece
  mainTimeline.to("#slide-manifesto", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.15)
              .to("#slide-manifesto .slide-body", { y: 0, duration: 0.06 }, 0.15)
              .to("#slide-manifesto", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.24)
              .to("#slide-manifesto .slide-body", { y: -40, duration: 0.06 }, 0.24);

  // Slide 3 (Sobre Nós) surge e desaparece com margem maior para clique/hover
  mainTimeline.to("#slide-sobre", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.05 }, 0.29)
              .to("#slide-sobre .slide-body", { y: 0, duration: 0.05 }, 0.29)
              .to("#slide-sobre", { opacity: 0, autoAlpha: 0, pointerEvents: "auto", duration: 0.06 }, 0.37)
              .to("#slide-sobre .slide-body", { y: -40, duration: 0.06 }, 0.37)
              .set("#slide-sobre", { pointerEvents: "none" }, 0.43);

  // Slide 4 (Pilares) surge e desaparece com margem maior para clique/hover
  mainTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.05 }, 0.47)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.05 }, 0.47)
              .to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "auto", duration: 0.06 }, 0.56)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.06 }, 0.56)
              .set("#slide-pilares", { pointerEvents: "none" }, 0.62);

  // Transição do Vídeo para o Vanta.js Clouds background
  mainTimeline.to("#vanta-bg", { opacity: 1, autoAlpha: 1, duration: 0.12, ease: "power2.inOut" }, 0.52)
              .to(".video-container", { opacity: 0, duration: 0.14, ease: "power2.inOut" }, 0.54);

  // Slide 5 (Atmosfera Gysa - Nuvem Background) surge e desaparece
  mainTimeline.to("#slide-atmosfera", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.60)
              .to("#slide-atmosfera .slide-body", { y: 0, duration: 0.06 }, 0.60)
              .to("#slide-atmosfera", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.69)
              .to("#slide-atmosfera .slide-body", { y: -40, duration: 0.06 }, 0.69);

  // Slide 6 (Galeria) surge e desaparece
  mainTimeline.to("#slide-galeria", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.75)
              .to("#slide-galeria .slide-body", { y: 0, duration: 0.06 }, 0.75)
              .to("#slide-galeria", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.84)
              .to("#slide-galeria .slide-body", { y: -40, duration: 0.06 }, 0.84);

  // Slide 7 (Convite/Rodapé - Nuvem Background) surge e permanece ativo
  mainTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.90)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.06 }, 0.90);

  // Inicializa o painel explorador de serviços
  renderTabs();
  renderSlides();
  renderDots();

  // Escuta os botões de navegação do painel
  document.getElementById("explorer-prev")?.addEventListener("click", prevSlide);
  document.getElementById("explorer-next")?.addEventListener("click", nextSlide);
  document.getElementById("explorer-prev-mobile")?.addEventListener("click", prevSlide);
  document.getElementById("explorer-next-mobile")?.addEventListener("click", nextSlide);

  // Sincroniza os dots no evento de swipe manual no mobile
  const slider = document.getElementById("explorer-slider");
  if (slider) {
    let scrollTimeout;
    slider.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const width = slider.clientWidth;
        const scrollLeft = slider.scrollLeft;
        if (width > 0) {
          const newIdx = Math.round(scrollLeft / width);
          const list = getFilteredServices();
          if (newIdx >= 0 && newIdx < list.length && newIdx !== currentSlideIdx) {
            currentSlideIdx = newIdx;
            renderDots();
          }
        }
      }, 50);
    });
  }
}

// ---------- ESTADO E DADOS DO EXPLORADOR DE SERVIÇOS ----------
const bookingBaseUrl = "https://agendeonline.salonsoft.com.br/espacogysa";

const rawServices = [
  { id: 1382197, category: "Cabelo", title: "Aplicação de Tintura-Tinta do Cliente", duration: 30, price: 100 },
  { id: 1382198, category: "Cabelo", title: "Coloração Cabelo Curto-Tinta do Salão", duration: 45, price: 180 },
  { id: 1383358, category: "Cabelo", title: "Coloração Cabelo Longo-Tinta do Salão", duration: 60, price: 260 },
  { id: 1383357, category: "Cabelo", title: "Coloração Cabelo Médio-Tinta do Salão", duration: 60, price: 220 },
  { id: 1384665, category: "Cabelo", title: "Corte Cabelo Crespo e Cacheado", duration: 25, price: 160 },
  { id: 1379864, category: "Cabelo", title: "Corte de Cabelo", duration: 30, price: 120 },
  { id: 1382203, category: "Cabelo", title: "Escova Cabelo Curto", duration: 30, price: 60 },
  { id: 1382202, category: "Cabelo", title: "Escova Cabelo Longo", duration: 30, price: 100 },
  { id: 1383361, category: "Cabelo", title: "Escova Cabelo Médio", duration: 30, price: 80 },
  { id: 1382205, category: "Cabelo", title: "Hidratação", duration: 30, price: 180 },
  { id: 1384390, category: "Cabelo", title: "Higienização", duration: 20, price: 25 },
  { id: 1382206, category: "Cabelo", title: "Lavagem Especial 3D Fusion", duration: 60, price: 250 },
  { id: 1382207, category: "Cabelo", title: "Mechas", duration: 120, price: 450 },
  { id: 1382192, category: "Cabelo", title: "Penteado Formanda", duration: 90, price: 200 },
  { id: 1382194, category: "Cabelo", title: "Penteado Noiva", duration: 90, price: 400 },
  { id: 1382209, category: "Cabelo", title: "Realinhamento ARGILA REDUCTION London", duration: 90, price: 450 },
  { id: 1383271, category: "Cabelo", title: "TRATAMENTO 3D FUSION", duration: 60, price: 290 },
  { id: 1383270, category: "Cabelo", title: "TRATAMENTO CONTROL REPAIR", duration: 60, price: 180 },
  { id: 1383269, category: "Cabelo", title: "TRATAMENTO KEEP COLOR", duration: 60, price: 180 },
  { id: 1383263, category: "Cabelo", title: "TRATAMENTO METAL OFF", duration: 60, price: 250 },
  { id: 1384411, category: "Depilação", title: "Depilação de Axilas", duration: 30, price: 40 },
  { id: 1384412, category: "Depilação", title: "Depilação de Braços", duration: 30, price: 30 },
  { id: 1384413, category: "Depilação", title: "Depilação de Buço", duration: 20, price: 35 },
  { id: 1384416, category: "Depilação", title: "Depilação de Buço com Linha", duration: 30, price: 35 },
  { id: 1384419, category: "Depilação", title: "Depilação de Nariz", duration: 20, price: 50 },
  { id: 1384420, category: "Depilação", title: "Depilação de Perna Inteira", duration: 30, price: 75 },
  { id: 1384421, category: "Depilação", title: "Depilação de Rosto", duration: 30, price: 100 },
  { id: 1384417, category: "Depilação", title: "Depilação Meia Perna", duration: 30, price: 50 },
  { id: 1384653, category: "Depilação", title: "Depilação Virilha Completa", duration: 35, price: 90 },
  { id: 1382255, category: "Estética Facial", title: "Dermaplaning", duration: 60, price: 220 },
  { id: 1384425, category: "Estética Facial", title: "Hydra Gloss", duration: 40, price: 250 },
  { id: 1368533, category: "Estética Facial", title: "Limpeza de Pele", duration: 60, price: 180 },
  { id: 1372181, category: "Harmonização Facial", title: "Aplicação de Toxina Botulínica-Botox", duration: 120, price: 899 },
  { id: 1384764, category: "Harmonização Facial", title: "Fios de PDO (NECESSITA AVALIAÇÃO)", duration: 120, price: 0 },
  { id: 1382249, category: "Lash Designer", title: "Extensão de Cílios", duration: 90, price: 190 },
  { id: 1384426, category: "Lash Designer", title: "Lash Lifting", duration: 60, price: 200 },
  { id: 1382250, category: "Lash Designer", title: "Manutenção de Cílios", duration: 90, price: 150 },
  { id: 1382222, category: "Mãos e Pés", title: "Esmaltação - Francesinha", duration: 5, price: 10 },
  { id: 1382230, category: "Mãos e Pés", title: "Esmaltação - Gel Top Gloss", duration: 40, price: 90 },
  { id: 1382223, category: "Mãos e Pés", title: "Esmaltação - Gel Top Gloss Francesa", duration: 40, price: 80 },
  { id: 1382227, category: "Mãos e Pés", title: "Esmaltação - Infantil", duration: 20, price: 25 },
  { id: 1382225, category: "Mãos e Pés", title: "Esmaltação - Mãos", duration: 20, price: 20 },
  { id: 1382226, category: "Mãos e Pés", title: "Esmaltação - Pés", duration: 20, price: 25 },
  { id: 1382228, category: "Mãos e Pés", title: "Esmaltação - Top Coat", duration: 30, price: 30 },
  { id: 1368524, category: "Mãos e Pés", title: "Manicure Pé e Mão Tradicional", duration: 60, price: 80 },
  { id: 1382232, category: "Mãos e Pés", title: "Manicure Tradicional", duration: 30, price: 38 },
  { id: 1382233, category: "Mãos e Pés", title: "Pedicure Tradicional", duration: 40, price: 45 },
  { id: 1383363, category: "Mãos e Pés", title: "Unha Artística - DECORAÇÃO", duration: 60, price: 50 },
  { id: 1382238, category: "Maquiagem", title: "Maquiagem Express - Dia Dia", duration: 30, price: 150 },
  { id: 1382239, category: "Maquiagem", title: "Maquiagem Formatura", duration: 90, price: 280 },
  { id: 1382243, category: "Maquiagem", title: "Maquiagem Noiva", duration: 120, price: 500 },
  { id: 1383076, category: "Maquiagem", title: "Maquiagem Social", duration: 60, price: 250 },
  { id: 1382215, category: "Nail Designer", title: "Alongamento de Unha - Acrílico - COLOCAÇÃO", duration: 120, price: 240 },
  { id: 1382213, category: "Nail Designer", title: "Alongamento de Unha - Molde F1 - COLOCAÇÃO", duration: 120, price: 220 },
  { id: 1382212, category: "Nail Designer", title: "Alongamento Fibra de Acrílico- Manutenção", duration: 90, price: 180 },
  { id: 1387752, category: "Nail Designer", title: "Alongamento Fibra de Vidro - COLOCAÇÃO", duration: 120, price: 250 },
  { id: 1382211, category: "Nail Designer", title: "Alongamento Fibra de Vidro - Manutenção", duration: 90, price: 180 },
  { id: 1382217, category: "Nail Designer", title: "Banho de Gel", duration: 90, price: 150 },
  { id: 1382218, category: "Nail Designer", title: "Blindagem em Gel", duration: 40, price: 150 },
  { id: 1382219, category: "Nail Designer", title: "Colocação de Unha (Única)", duration: 20, price: 25 },
  { id: 1385668, category: "Nail Designer", title: "Gel na Tips - COLOCAÇÃO", duration: 120, price: 210 },
  { id: 1382220, category: "Nail Designer", title: "Remoção de Unhas Artificiais", duration: 40, price: 60 },
  { id: 1383362, category: "Nail Designer", title: "Remoção Esmalte de Gel", duration: 20, price: 20 },
  { id: 1385667, category: "Nail Designer", title: "Tips Realista - COLOCAÇÃO", duration: 60, price: 180 },
  { id: 1382221, category: "Nail Designer", title: "Unha de Gel - COLOCAÇÃO", duration: 120, price: 180 },
  { id: 1382195, category: "Podologia", title: "Aplicação Alta Frequência", duration: 30, price: 60 },
  { id: 1384399, category: "Podologia", title: "Assepsia Laminas", duration: 50, price: 135 },
  { id: 1384401, category: "Podologia", title: "Calosidade Plantar", duration: 60, price: 40 },
  { id: 1384402, category: "Podologia", title: "Manutenção de Órtese", duration: 30, price: 60 },
  { id: 1384405, category: "Podologia", title: "Podologia", duration: 60, price: 155 },
  { id: 1382184, category: "Sobrancelhas", title: "Brow Lamination", duration: 40, price: 130 },
  { id: 1382180, category: "Sobrancelhas", title: "Depilação Sobrancelha - cera fria", duration: 30, price: 60 },
  { id: 1382182, category: "Sobrancelhas", title: "Pintura Sobrancelhas", duration: 30, price: 35 },
  { id: 1387344, category: "Sobrancelhas", title: "Sobrancelha - Pinça", duration: 30, price: 60 },
  { id: 1384432, category: "SPA para os Pés", title: "Escalda Pés", duration: 40, price: 120 },
  { id: 1384435, category: "SPA para os Pés", title: "Spa dos Pés Aromático com Óleo Essencial", duration: 60, price: 170 },
];

const serviceCopyByCategory = {
  "Cabelo": "Agenda online para cortes, escovas, coloração, mechas e tratamentos capilares com atendimento especializado.",
  "Depilação": "Depilação com técnica cuidadosa, higiene e conforto para rosto e corpo.",
  "Estética Facial": "Protocolos faciais para limpeza, renovação, viço e pele bem cuidada.",
  "Harmonização Facial": "Procedimentos estéticos avançados com avaliação profissional e foco em naturalidade.",
  "Lash Designer": "Cílios com acabamento delicado para valorizar o olhar com leveza.",
  "Mãos e Pés": "Manicure, pedicure e esmaltação com acabamento preciso para o dia a dia.",
  "Maquiagem": "Maquiagem profissional para rotina, eventos, formaturas e noivas.",
  "Nail Designer": "Alongamentos, gel, blindagem e manutenção para unhas resistentes e elegantes.",
  "Podologia": "Cuidados técnicos para conforto, saúde e bem-estar dos pés.",
  "Sobrancelhas": "Design, brow lamination e pintura para harmonizar o olhar.",
  "SPA para os Pés": "Rituais relaxantes para pés com toque sensorial e aromático."
};

function formatDuration(minutes) {
  if (minutes < 60) return `${String(minutes).padStart(2, "0")}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h${String(mins).padStart(2, "0")}min` : `${hours}h`;
}

function formatPrice(price) {
  if (!price) return "sob avaliação";
  return `a partir de R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const unsplashImage = (photoId, position = "center") =>
  `https://images.unsplash.com/${photoId}?q=90&w=1100&h=1350&auto=format&fit=crop&crop=faces,edges&fm=webp&ixlib=rb-4.1.0&fp-y=${position}`;

const serviceImageCollections = {
  hairColor: [
    unsplashImage("photo-1560066984-138dadb4c035", "0.42"),
    unsplashImage("photo-1522337360788-8b13dee7a37e", "0.36"),
    unsplashImage("photo-1595476108010-b4d1f102b1b1", "0.38"),
    unsplashImage("photo-1527799820374-dcf8d9d4a388", "0.44")
  ],
  curlyHair: [
    unsplashImage("photo-1519415510236-718bdfcd89c8", "0.34"),
    unsplashImage("photo-1524504388940-b1c1722653e1", "0.35"),
    unsplashImage("photo-1496440737103-cd596325d314", "0.33")
  ],
  hairTreatment: [
    unsplashImage("photo-1522338242992-e1a54906a8da", "0.44"),
    unsplashImage("photo-1521590832167-7bcbfaa6381f", "0.48"),
    unsplashImage("photo-1596178065887-1198b6148b2b", "0.42"),
    unsplashImage("photo-1516975080664-ed2fc6a32937", "0.36")
  ],
  hairStyling: [
    unsplashImage("photo-1487412947147-5cebf100ffc2", "0.35"),
    unsplashImage("photo-1487412912498-0447578fcca8", "0.36"),
    unsplashImage("photo-1519699047748-de8e457a634e", "0.38"),
    unsplashImage("photo-1509967419530-da38b4704bc6", "0.34")
  ],
  waxing: [
    unsplashImage("photo-1570172619644-dfd03ed5d881", "0.45"),
    unsplashImage("photo-1600334129128-685c5582fd35", "0.48"),
    unsplashImage("photo-1540555700478-4be289fbecef", "0.42"),
    unsplashImage("photo-1512290923902-8a9f81dc236c", "0.42")
  ],
  facial: [
    unsplashImage("photo-1570172619644-dfd03ed5d881", "0.42"),
    unsplashImage("photo-1512290923902-8a9f81dc236c", "0.42"),
    unsplashImage("photo-1600334129128-685c5582fd35", "0.48"),
    unsplashImage("photo-1596755389378-c31d21fd1273", "0.45")
  ],
  aesthetic: [
    unsplashImage("photo-1556228720-195a672e8a03", "0.42"),
    unsplashImage("photo-1570172619644-dfd03ed5d881", "0.44"),
    unsplashImage("photo-1515377905703-c4788e51af15", "0.46")
  ],
  lashes: [
    unsplashImage("photo-1522338242992-e1a54906a8da", "0.34"),
    unsplashImage("photo-1512496015851-a90fb38ba796", "0.34"),
    unsplashImage("photo-1487412947147-5cebf100ffc2", "0.34")
  ],
  manicure: [
    unsplashImage("photo-1519014816548-bf5fe059798b", "0.43"),
    unsplashImage("photo-1604654894610-df63bc536371", "0.43"),
    unsplashImage("photo-1607779097040-26e80aa78e66", "0.44"),
    unsplashImage("photo-1610992015732-2449b76344bc", "0.44")
  ],
  makeup: [
    unsplashImage("photo-1487412947147-5cebf100ffc2", "0.34"),
    unsplashImage("photo-1522338242992-e1a54906a8da", "0.34"),
    unsplashImage("photo-1512496015851-a90fb38ba796", "0.35"),
    unsplashImage("photo-1526045478516-99145907023c", "0.35")
  ],
  podology: [
    unsplashImage("photo-1540555700478-4be289fbecef", "0.45"),
    unsplashImage("photo-1515377905703-c4788e51af15", "0.44"),
    unsplashImage("photo-1600334129128-685c5582fd35", "0.5"),
    unsplashImage("photo-1521590832167-7bcbfaa6381f", "0.5")
  ],
  brows: [
    unsplashImage("photo-1512496015851-a90fb38ba796", "0.34"),
    unsplashImage("photo-1522338242992-e1a54906a8da", "0.35"),
    unsplashImage("photo-1487412947147-5cebf100ffc2", "0.34")
  ],
  spaFeet: [
    unsplashImage("photo-1540555700478-4be289fbecef", "0.45"),
    unsplashImage("photo-1515377905703-c4788e51af15", "0.48"),
    unsplashImage("photo-1521590832167-7bcbfaa6381f", "0.5")
  ],
  default: [
    unsplashImage("photo-1522337360788-8b13dee7a37e", "0.38"),
    unsplashImage("photo-1570172619644-dfd03ed5d881", "0.42"),
    unsplashImage("photo-1519014816548-bf5fe059798b", "0.43")
  ]
};

function selectServiceImage(service, collectionName, serviceIndex = 0) {
  const collection = serviceImageCollections[collectionName] || serviceImageCollections.default;
  const imageKey = `${service.id}-${service.category}-${service.title}`;
  const hash = Array.from(imageKey).reduce((total, char) => total + char.charCodeAt(0), 0);
  const index = (hash + serviceIndex) % collection.length;
  return collection[index];
}

function getServiceImage(service, serviceIndex = 0) {
  const title = service.title.toLowerCase();

  if (title.includes("tintura") || title.includes("coloração") || title.includes("mechas") || title.includes("color")) {
    return selectServiceImage(service, "hairColor", serviceIndex);
  }
  if (title.includes("crespo") || title.includes("cacheado")) {
    return selectServiceImage(service, "curlyHair", serviceIndex);
  }
  if (title.includes("hidratação") || title.includes("tratamento") || title.includes("fusion") || title.includes("repair") || title.includes("metal") || title.includes("lavagem") || title.includes("higienização")) {
    return selectServiceImage(service, "hairTreatment", serviceIndex);
  }
  if (title.includes("escova") || title.includes("penteado") || title.includes("corte")) {
    return selectServiceImage(service, "hairStyling", serviceIndex);
  }
  if (title.includes("dermaplaning") || title.includes("hydra") || title.includes("limpeza de pele")) {
    return selectServiceImage(service, "facial", serviceIndex);
  }
  if (title.includes("toxina") || title.includes("botox") || title.includes("pdo")) {
    return selectServiceImage(service, "aesthetic", serviceIndex);
  }
  if (title.includes("alongamento") || title.includes("gel") || title.includes("tips") || title.includes("blindagem") || title.includes("unha") || title.includes("esmaltação") || title.includes("manicure") || title.includes("pedicure")) {
    return selectServiceImage(service, "manicure", serviceIndex);
  }
  if (title.includes("podologia") || title.includes("calosidade") || title.includes("órtese") || title.includes("pés") || title.includes("escalda")) {
    return selectServiceImage(service, service.category === "SPA para os Pés" ? "spaFeet" : "podology", serviceIndex);
  }
  if (title.includes("noiva") || title.includes("formatura") || title.includes("maquiagem")) {
    return selectServiceImage(service, "makeup", serviceIndex);
  }
  if (title.includes("cílios") || title.includes("lash")) {
    return selectServiceImage(service, "lashes", serviceIndex);
  }
  if (title.includes("sobrancelha") || title.includes("brow")) {
    return selectServiceImage(service, "brows", serviceIndex);
  }
  if (service.category === "Depilação") {
    return selectServiceImage(service, "waxing", serviceIndex);
  }
  if (service.category === "Mãos e Pés" || service.category === "Nail Designer") {
    return selectServiceImage(service, "manicure", serviceIndex);
  }
  return selectServiceImage(service, "default", serviceIndex);
}

function getServiceDescription(service) {
  return serviceCopyByCategory[service.category] || "Agende online seu atendimento no Espaço Gysa.";
}

const services = rawServices.map((service, serviceIndex) => ({
  ...service,
  desc: getServiceDescription(service),
  durationLabel: formatDuration(service.duration),
  priceLabel: formatPrice(service.price),
  link: `${bookingBaseUrl}/${service.id}`,
  cta: "Agendar online",
  image: getServiceImage(service, serviceIndex)
}));

const categories = ["Todos", ...Array.from(new Set(services.map(service => service.category)))];
let activeCategory = "Todos";
let currentSlideIdx = 0;
let selectedServiceIdx = null;

function getFilteredServices() {
  return activeCategory === "Todos" ? services : services.filter(s => s.category === activeCategory);
}

// Renderiza abas de categoria
function renderTabs() {
  const tabsContainer = document.getElementById("explorer-tabs");
  if (!tabsContainer) return;
  tabsContainer.innerHTML = categories.map(cat => {
    const isActive = cat === activeCategory;
    const btnClass = isActive ? "explorer-tab-btn active" : "explorer-tab-btn inactive";
    return `<button onclick="selectCategory('${cat}')" class="${btnClass}">${cat}</button>`;
  }).join("");
}

// Seleciona categoria
function selectCategory(cat) {
  activeCategory = cat;
  currentSlideIdx = 0;
  renderTabs();
  renderSlides();
  renderDots();
  scrollToCurrentSlide(false);
}

// Renderiza slides de serviços
function renderSlides() {
  const slider = document.getElementById("explorer-slider");
  if (!slider) return;
  const list = getFilteredServices();
  slider.innerHTML = list.map((item, idx) => {
    const imageLoading = idx < 3 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return `
      <div onclick="openServiceModal(${idx})" class="service-explorer-card-item animate-fade-up">
        <div class="explorer-card-bg-container">
          <img src="${item.image}" alt="${item.title}" class="explorer-card-image" ${imageLoading} decoding="async">
          <div class="explorer-card-overlay"></div>
        </div>
        <div class="explorer-card-badge">
          <span class="text-rose-400">✦</span> ${item.category}
        </div>
        <div class="explorer-card-content">
          <h3 class="explorer-card-title">${item.title}</h3>
          <p class="explorer-card-desc">${item.desc}</p>
          <div class="explorer-card-meta">
            <span>⏱ ${item.durationLabel}</span>
            <span class="explorer-card-price">${item.priceLabel}</span>
          </div>
          <a href="${item.link}" onclick="event.stopPropagation()" target="_blank" rel="noopener" class="explorer-card-btn" aria-label="Agendar ${item.title} online">${item.cta}</a>
        </div>
      </div>
    `;
  }).join("");
}

// Renderiza dots
function renderDots() {
  const dotsContainer = document.getElementById("explorer-dots");
  if (!dotsContainer) return;
  const list = getFilteredServices();
  dotsContainer.innerHTML = list.map((_, idx) => {
    const isActive = idx === currentSlideIdx;
    const dotClass = isActive ? "explorer-dot active" : "explorer-dot inactive";
    return `<button onclick="goToSlide(${idx})" class="${dotClass}" aria-label="Ir para o slide ${idx + 1}"></button>`;
  }).join("");
}

// Navegação do slider
function scrollToCurrentSlide(smooth = true) {
  const slider = document.getElementById("explorer-slider");
  if (!slider || !slider.children.length) return;
  const card = slider.children[currentSlideIdx];
  if (card) {
    slider.scrollTo({
      left: card.offsetLeft - 4,
      behavior: smooth ? "smooth" : "auto"
    });
  }
}

function goToSlide(idx) {
  currentSlideIdx = idx;
  renderDots();
  scrollToCurrentSlide(true);
}

function nextSlide() {
  const list = getFilteredServices();
  if (!list.length) return;
  currentSlideIdx = (currentSlideIdx + 1) % list.length;
  goToSlide(currentSlideIdx);
}

function prevSlide() {
  const list = getFilteredServices();
  if (!list.length) return;
  currentSlideIdx = (currentSlideIdx - 1 + list.length) % list.length;
  goToSlide(currentSlideIdx);
}

// ---------- CONTROLE DO MODAL DE DETALHES ----------
function openServiceModal(idx) {
  selectedServiceIdx = idx;
  renderModalDetails();
  const modal = document.getElementById("service-modal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeServiceModal(e) {
  if (e) e.stopPropagation();
  selectedServiceIdx = null;
  const modal = document.getElementById("service-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function modalNav(e, dir) {
  if (e) e.stopPropagation();
  const list = getFilteredServices();
  if (!list.length) return;
  selectedServiceIdx = (selectedServiceIdx + dir + list.length) % list.length;
  renderModalDetails();
}

function renderModalDetails() {
  const list = getFilteredServices();
  const item = list[selectedServiceIdx];
  if (!item) return;
  
  const modalImage = document.getElementById("modal-image");
  const modalCategory = document.getElementById("modal-category");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalDuration = document.getElementById("modal-duration");
  const modalPrice = document.getElementById("modal-price");
  const modalCta = document.getElementById("modal-booking-cta");
  
  if (modalImage) modalImage.src = item.image;
  if (modalImage) modalImage.alt = item.title;
  if (modalCategory) modalCategory.innerHTML = `<span class="text-rose-400">✦</span> ${item.category}`;
  if (modalTitle) modalTitle.innerText = item.title;
  if (modalDesc) modalDesc.innerText = item.desc;
  if (modalDuration) modalDuration.innerText = `⏱ Duração: ${item.durationLabel}`;
  if (modalPrice) modalPrice.innerText = item.priceLabel;
  
  if (modalCta) {
    modalCta.href = item.link;
    modalCta.innerText = "AGENDAR ONLINE";
    modalCta.setAttribute("aria-label", `Agendar ${item.title} online`);
  }
}

// ==========================================================================
// INSTAGRAM STORIES VIEWERS LOGIC
// ==========================================================================
let activeStoryIndex = 0;
let storyTimer = null;
let isStoryPaused = false;
let storyCurrentDuration = 8000;
let storyTimerElapsed = 0;
let storyTimerLastTick = 0;

// Mapeamento dos links reais de posts do Instagram do cliente correspondentes
const storyInstagramLinks = [
  "https://www.instagram.com/reel/DadMNxkMVON/", // Inauguração
  "https://www.instagram.com/espacogysadf/",  // Localização
  "https://www.instagram.com/reel/DaFy4SNRjEJ/",  // Essência
  "https://www.instagram.com/espacogysadf/",  // Equipe
  "https://www.instagram.com/espacogysadf/",  // Produtos
  "https://www.instagram.com/reel/DagDg1yRdZ7/" // Reels do Ambiente
];

const instagramEmbedStoryIndexes = new Set([0, 2]);
const storyDurations = [18000, 23000, 18000, 8000, 8000, 18000];

function getStoryCount() {
  return document.querySelectorAll(".story-slide").length;
}

function getActiveStoryVideo() {
  return document.querySelector(`#story-slide-${activeStoryIndex} .story-video-player`);
}

function processInstagramEmbeds() {
  if (window.instgrm?.Embeds?.process) {
    window.instgrm.Embeds.process();
  }
}

function updateStoryEmbedMode() {
  const modal = document.getElementById("story-modal");
  modal?.classList.toggle("embed-active", instagramEmbedStoryIndexes.has(activeStoryIndex));
  if (instagramEmbedStoryIndexes.has(activeStoryIndex)) {
    window.setTimeout(processInstagramEmbeds, 60);
  }
}

function updateStoryVideos() {
  document.querySelectorAll(".story-video-player").forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });

  const activeVideo = getActiveStoryVideo();
  if (!isStoryPaused) {
    activeVideo?.play().catch(err => console.log("Video playback blocked:", err));
  }
}

function updatePlayPauseUI() {
  const btn = document.getElementById("story-play-pause-btn");
  if (!btn) return;
  const iconPause = btn.querySelector(".icon-pause");
  const iconPlay = btn.querySelector(".icon-play");

  if (isStoryPaused) {
    if (iconPause) iconPause.style.display = "none";
    if (iconPlay) iconPlay.style.display = "block";
    btn.setAttribute("aria-label", "Retomar Story");
  } else {
    if (iconPause) iconPause.style.display = "block";
    if (iconPlay) iconPlay.style.display = "none";
    btn.setAttribute("aria-label", "Pausar Story");
  }
}

window.toggleStoryPlay = function() {
  isStoryPaused = !isStoryPaused;
  updatePlayPauseUI();

  const activeVideo = getActiveStoryVideo();
  if (activeVideo) {
    if (isStoryPaused) activeVideo.pause();
    else activeVideo.play().catch(err => console.log(err));
  }
};

window.openStory = function(index, event) {
  if (event) event.stopPropagation();
  activeStoryIndex = index;
  isStoryPaused = false;
  
  const modal = document.getElementById("story-modal");
  if (!modal) return;
  modal.classList.add("active");

  // Ajusta o link da ação do Instagram
  const instaLinkBtn = modal.querySelector(".story-insta-btn");
  if (instaLinkBtn && storyInstagramLinks[activeStoryIndex]) {
    instaLinkBtn.href = storyInstagramLinks[activeStoryIndex];
  }

  updateStoryVideos();
  updateStorySlides();
  resetStoryProgress();
  startStoryTimer();
};

window.closeStory = function() {
  const modal = document.getElementById("story-modal");
  if (modal) modal.classList.remove("active", "embed-active");
  
  isStoryPaused = false;

  document.querySelectorAll(".story-video-player").forEach((video) => video.pause());
  
  if (storyTimer) {
    clearInterval(storyTimer);
    storyTimer = null;
  }
};

window.nextStory = function() {
  if (activeStoryIndex < getStoryCount() - 1) {
    activeStoryIndex++;
    isStoryPaused = false;

    // Atualiza link do Insta do botão correspondente
    const modal = document.getElementById("story-modal");
    const instaLinkBtn = modal?.querySelector(".story-insta-btn");
    if (instaLinkBtn && storyInstagramLinks[activeStoryIndex]) {
      instaLinkBtn.href = storyInstagramLinks[activeStoryIndex];
    }

    updateStoryVideos();
    updateStorySlides();
    resetStoryProgress();
    startStoryTimer();
  } else {
    closeStory();
  }
};

window.prevStory = function() {
  if (activeStoryIndex > 0) {
    activeStoryIndex--;
    isStoryPaused = false;

    const modal = document.getElementById("story-modal");
    const instaLinkBtn = modal?.querySelector(".story-insta-btn");
    if (instaLinkBtn && storyInstagramLinks[activeStoryIndex]) {
      instaLinkBtn.href = storyInstagramLinks[activeStoryIndex];
    }

    updateStoryVideos();
    updateStorySlides();
    resetStoryProgress();
    startStoryTimer();
  }
};

function updateStorySlides() {
  const slides = document.querySelectorAll(".story-slide");
  slides.forEach((slide, idx) => {
    if (idx === activeStoryIndex) {
      slide.classList.add("active");
    } else {
      slide.classList.remove("active");
    }
  });

  updateStoryEmbedMode();
  
  // Preenche barras anteriores e limpa posteriores
  const fills = document.querySelectorAll(".story-progress-fill");
  fills.forEach((fill, idx) => {
    if (idx < activeStoryIndex) {
      fill.style.width = "100%";
    } else if (idx > activeStoryIndex) {
      fill.style.width = "0%";
    }
  });
}

function resetStoryProgress() {
  const fills = document.querySelectorAll(".story-progress-fill");
  if (fills[activeStoryIndex]) {
    fills[activeStoryIndex].style.width = "0%";
  }
}

function startStoryTimer() {
  if (storyTimer) clearInterval(storyTimer);
  isStoryPaused = false;
  updatePlayPauseUI();
  
  storyCurrentDuration = storyDurations[activeStoryIndex] || 8000;
  storyTimerElapsed = 0;
  storyTimerLastTick = Date.now();
  
  runStoryTick();
}

function runStoryTick() {
  const fills = document.querySelectorAll(".story-progress-fill");
  const fill = fills[activeStoryIndex];
  
  storyTimer = setInterval(() => {
    if (isStoryPaused) {
      storyTimerLastTick = Date.now();
      return;
    }
    
    const now = Date.now();
    storyTimerElapsed += (now - storyTimerLastTick);
    storyTimerLastTick = now;
    
    const percentage = Math.min((storyTimerElapsed / storyCurrentDuration) * 100, 100);
    
    if (fill) {
      fill.style.width = `${percentage}%`;
    }
    
    if (storyTimerElapsed >= storyCurrentDuration) {
      clearInterval(storyTimer);
      nextStory();
    }
  }, 50);
}

// Binda métodos no escopo global para onclick no HTML
window.nextStory = nextStory;
window.prevStory = prevStory;
window.selectCategory = selectCategory;
window.goToSlide = goToSlide;
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;
window.modalNav = modalNav;

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
