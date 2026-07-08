import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Seletores DOM
const canvas = document.getElementById("video-canvas");
const context = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
const slides = document.querySelectorAll(".text-slide");
const mobileMedia = window.matchMedia("(max-width: 768px), (pointer: coarse)");
const isMobileDevice = () => mobileMedia.matches;

function tuneCanvasQuality() {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
}

tuneCanvasQuality();

// Configurações da sequência de frames
const frameCount = 568;
const frameBasePath = isMobileDevice() ? "frames60" : "frames60hd";
const getFramePath = (index) => `/${frameBasePath}/frame_${index.toString().padStart(4, "0")}.jpg`;

// Pré-carregamento de Imagens
const images = new Array(frameCount);
const frameLoadState = new Array(frameCount).fill("idle");
const airplay = { frame: 0 };
const initialFramePreload = isMobileDevice() ? 72 : 96;
const framePreloadBatchSize = isMobileDevice() ? 32 : 48;
const framePreloadConcurrency = isMobileDevice() ? 6 : 10;
const frameLookAhead = isMobileDevice() ? 18 : 28;

let loadedImagesCount = 0;
let isLoaded = false;
let activeFrameLoads = 0;
let nextSequentialFrame = 0;
let renderScheduled = false;
let resizeScheduled = false;
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

function getRenderableFrame(targetFrame) {
  if (images[targetFrame]?.complete) return targetFrame;

  for (let offset = 1; offset <= frameLookAhead * 2; offset++) {
    const previousFrame = targetFrame - offset;
    const nextFrame = targetFrame + offset;

    if (previousFrame >= 0 && images[previousFrame]?.complete) return previousFrame;
    if (nextFrame < frameCount && images[nextFrame]?.complete) return nextFrame;
  }

  return null;
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
  const maxPixelRatio = isMobileDevice() ? 1.35 : 1.85;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  const nextWidth = Math.round(window.innerWidth * pixelRatio);
  const nextHeight = Math.round(window.innerHeight * pixelRatio);

  if (canvas.width === nextWidth && canvas.height === nextHeight) return;

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  tuneCanvasQuality();
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  lastRenderedFrame = -1; // Força re-renderização imediata
  requestRender();
}

function requestResizeCanvas() {
  if (resizeScheduled) return;
  resizeScheduled = true;
  requestAnimationFrame(() => {
    resizeScheduled = false;
    resizeCanvas();
  });
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
  const targetFrame = Math.round(airplay.frame);
  const currentFrame = getRenderableFrame(targetFrame);
  if (currentFrame === null || currentFrame === lastRenderedFrame) return;

  const img = images[currentFrame];

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

window.addEventListener("resize", requestResizeCanvas, { passive: true });

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
  const sceneButtons = document.querySelectorAll(".scene-toggle-btn");
  const menuToggle = document.querySelector(".menu-toggle-btn");
  const sideMenu = document.getElementById("side-menu");
  const isMobileTimeline = isMobileDevice();
  const sceneProgressMap = isMobileTimeline
    ? [0, 0.16, 0.31, 0.49, 0.67, 0.835, 0.878, 0.94]
    : [0, 0.16, 0.31, 0.49, 0.66, 0.84, 0.895, 0.895];

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

  const backgroundInPoint = isMobileTimeline ? 0.592 : 0.578;
  const backgroundReadyPoint = isMobileTimeline ? 0.615 : 0.602;
  const servicesInPoint = isMobileTimeline ? 0.622 : 0.61;
  const servicesOutPoint = isMobileTimeline ? 0.805 : 0.80;
  const galleryInPoint = isMobileTimeline ? 0.835 : 0.83;
  const galleryOutPoint = isMobileTimeline ? 0.858 : 0.872;
  const reviewsInPoint = isMobileTimeline ? 0.868 : 0.89;
  const reviewsOutPoint = isMobileTimeline ? 0.905 : 0.918;
  const finalInPoint = isMobileTimeline ? 0.922 : 0.89;
  const timelinePoints = {
    sobreIn: isMobileTimeline ? 0.33 : 0.29,
    sobreOut: isMobileTimeline ? 0.42 : 0.37,
    sobreOff: isMobileTimeline ? 0.48 : 0.43,
    pilaresIn: isMobileTimeline ? 0.50 : 0.47,
    pilaresOut: isMobileTimeline ? 0.555 : 0.54,
    pilaresOff: 0.60,
    servicesIn: servicesInPoint,
    servicesOut: servicesOutPoint,
    galleryIn: galleryInPoint,
    galleryOut: galleryOutPoint,
    vantaIn: backgroundInPoint,
    backgroundReady: backgroundReadyPoint,
    videoOut: backgroundInPoint
  };

  const hoverRescueSlides = [
    { element: document.getElementById("slide-sobre"), targetSelector: ".sobre-grid", start: timelinePoints.sobreIn, end: timelinePoints.sobreOff },
    { element: document.getElementById("slide-pilares"), targetSelector: ".pilares-grid", start: timelinePoints.pilaresIn, end: timelinePoints.pilaresOff }
  ].filter(({ element }) => Boolean(element));

  hoverRescueSlides.forEach(({ element, targetSelector }) => {
    const rescueTarget = element.querySelector(targetSelector) || element.querySelector(".slide-body") || element;

    rescueTarget.addEventListener("mouseenter", () => {
      if (element.classList.contains("hover-rescue-candidate")) {
        element.classList.add("is-hover-rescued");
      }
    });

    rescueTarget.addEventListener("mouseleave", () => {
      element.classList.remove("is-hover-rescued");
    });

    rescueTarget.addEventListener("focusin", () => {
      if (element.classList.contains("hover-rescue-candidate")) {
        element.classList.add("is-hover-rescued");
      }
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
  const servicesSlideStart = timelinePoints.servicesIn;

  function updateWhatsAppPromptVisibility(progress) {
    whatsappPrompt?.classList.toggle("is-hidden-after-services", progress >= servicesSlideStart);
  }

  const accordionCardGroups = [];

  function setStoryCardExpanded(card, expanded, buttonSelector) {
    card.classList.toggle("is-expanded", expanded);
    const button = card.querySelector(buttonSelector);
    button?.setAttribute("aria-expanded", String(expanded));
    const symbol = button?.querySelector("span");
    if (symbol) symbol.textContent = expanded ? "−" : "+";
    const storyHint = card.querySelector(".story-hint");
    storyHint?.setAttribute("tabindex", expanded || !isMobileDevice() ? "0" : "-1");
  }

  function toggleStoryCardAccordion(cards, card, buttonSelector) {
    const shouldExpand = !card.classList.contains("is-expanded");

    cards.forEach((candidate) => {
      setStoryCardExpanded(candidate, candidate === card && shouldExpand, buttonSelector);
    });
  }

  function setupStoryAccordionCards(cardSelector, buttonSelector) {
    const cards = Array.from(document.querySelectorAll(cardSelector));
    if (!cards.length) return;

    accordionCardGroups.push({ cards, buttonSelector });

    cards.forEach((card) => {
      const storyIndex = Number(card.dataset.storyIndex);
      const expandButton = card.querySelector(buttonSelector);
      const storyHint = card.querySelector(".story-hint");

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      storyHint?.setAttribute("role", "button");
      storyHint?.setAttribute("tabindex", "0");

      card.addEventListener("click", (event) => {
        if (event.target.closest(buttonSelector)) return;

        if (event.target.closest(".story-hint")) {
          event.stopPropagation();
          openStory(storyIndex, event);
          return;
        }

        if (isMobileDevice()) {
          toggleStoryCardAccordion(cards, card, buttonSelector);
        } else {
          openStory(storyIndex, event);
        }
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        if (isMobileDevice()) {
          toggleStoryCardAccordion(cards, card, buttonSelector);
        } else {
          openStory(storyIndex, event);
        }
      });

      expandButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleStoryCardAccordion(cards, card, buttonSelector);
      });

      storyHint?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        event.stopPropagation();
        openStory(storyIndex, event);
      });

      setStoryCardExpanded(card, false, buttonSelector);
    });
  }

  setupStoryAccordionCards(".sobre-card", ".card-expand-btn");
  setupStoryAccordionCards(".pilar-card", ".pilar-expand-btn");

  mobileMedia.addEventListener?.("change", () => {
    accordionCardGroups.forEach(({ cards, buttonSelector }) => {
      cards.forEach((card) => setStoryCardExpanded(card, false, buttonSelector));
    });
  });

  // Timeline unificada para controlar a sequência de frames e fades de texto
  const mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-tracker",
      start: "top top",
      end: "bottom bottom",
      scrub: true // Sincroniza exatamente com o scroll e evita slides atrasados/sobrepostos.
    }
  });

  function updateWarpBackgroundVisibility(progress) {
    const warpActive = progress >= timelinePoints.vantaIn;
    document.body.classList.toggle("is-warp-active", warpActive);
    const vantaLayer = document.getElementById("vanta-bg");
    const videoLayer = document.querySelector(".video-container");
    if (vantaLayer) {
      vantaLayer.style.visibility = warpActive ? "visible" : "";
    }
  }

  // Controla dinamicamente o background leve de transição.
  mainTimeline.eventCallback("onUpdate", () => {
    const progress = mainTimeline.progress();
    updateHoverRescueCandidates(progress);
    updateWhatsAppPromptVisibility(progress);
    updateWarpBackgroundVisibility(progress);
  });
  updateHoverRescueCandidates(0);
  updateWhatsAppPromptVisibility(0);
  updateWarpBackgroundVisibility(0);

  // Vincula ativação dos indicadores para 8 slides
  mainTimeline.call(setActiveIndicator, [0], 0.0)
              .call(setActiveIndicator, [1], 0.15)
              .call(setActiveIndicator, [2], timelinePoints.sobreIn)
              .call(setActiveIndicator, [3], timelinePoints.pilaresIn)
              .call(setActiveIndicator, [4], timelinePoints.servicesIn)
              .call(setActiveIndicator, [5], timelinePoints.galleryIn)
              .call(setActiveIndicator, [6], reviewsInPoint)
              .call(setActiveIndicator, [7], finalInPoint);

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
  mainTimeline.to("#slide-sobre", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.05 }, timelinePoints.sobreIn)
              .to("#slide-sobre .slide-body", { y: 0, duration: 0.05 }, timelinePoints.sobreIn)
              .to("#slide-sobre", { opacity: 0, autoAlpha: 0, pointerEvents: "auto", duration: 0.06 }, timelinePoints.sobreOut)
              .to("#slide-sobre .slide-body", { y: -40, duration: 0.06 }, timelinePoints.sobreOut)
              .set("#slide-sobre", { pointerEvents: "none" }, timelinePoints.sobreOff);

  // Slide 4 (Pilares) surge e desaparece com margem maior para clique/hover
  mainTimeline.to("#slide-pilares", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.05 }, timelinePoints.pilaresIn)
              .to("#slide-pilares .slide-body", { y: 0, duration: 0.05 }, timelinePoints.pilaresIn)
              .to("#slide-pilares", { opacity: 0, autoAlpha: 0, pointerEvents: "auto", duration: 0.05 }, timelinePoints.pilaresOut)
              .to("#slide-pilares .slide-body", { y: -40, duration: 0.05 }, timelinePoints.pilaresOut)
              .set("#slide-pilares", { pointerEvents: "none" }, timelinePoints.pilaresOff);

  // Transição do vídeo para o background CSS leve
  mainTimeline.to("#vanta-bg", { opacity: 1, autoAlpha: 1, duration: timelinePoints.backgroundReady - timelinePoints.vantaIn, ease: "power2.inOut" }, timelinePoints.vantaIn)
              .to(".video-container", { opacity: 0, duration: timelinePoints.backgroundReady - timelinePoints.videoOut, ease: "power2.inOut" }, timelinePoints.videoOut);

  // Slide 5 (Atmosfera Gysa - Nuvem Background) surge e desaparece
  mainTimeline.to("#slide-atmosfera", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.025 }, timelinePoints.servicesIn)
              .to("#slide-atmosfera .slide-body", { y: 0, duration: 0.025 }, timelinePoints.servicesIn)
              .to("#slide-atmosfera", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.025 }, timelinePoints.servicesOut)
              .to("#slide-atmosfera .slide-body", { y: -40, duration: 0.025 }, timelinePoints.servicesOut);

  // Slide 6 (Galeria) surge e desaparece
  mainTimeline.to("#slide-galeria", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.03 }, timelinePoints.galleryIn)
              .to("#slide-galeria .slide-body", { y: 0, duration: 0.03 }, timelinePoints.galleryIn)
              .to("#slide-galeria", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.025 }, timelinePoints.galleryOut)
              .to("#slide-galeria .slide-body", { y: -40, duration: 0.025 }, timelinePoints.galleryOut);

  // Slide 7 (Reviews Google) surge e desaparece
  if (isMobileTimeline) {
    mainTimeline.to("#slide-reviews", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.03 }, reviewsInPoint)
                .to("#slide-reviews .slide-body", { y: 0, duration: 0.03 }, reviewsInPoint)
                .to("#slide-reviews", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.025 }, reviewsOutPoint)
                .to("#slide-reviews .slide-body", { y: -40, duration: 0.025 }, reviewsOutPoint);
  }

  // Slide 8 (Convite/Rodapé - Background leve) surge e permanece ativo
  mainTimeline.to("#slide-convite", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.03 }, finalInPoint)
              .to("#slide-convite .slide-body", { y: 0, duration: 0.03 }, finalInPoint);

  mainTimeline.call(() => {}, [], 1.0);

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
  "Cabelo": "Atendimento capilar com avaliação do fio, técnica profissional e acabamento alinhado ao serviço escolhido.",
  "Depilação": "Depilação com técnica cuidadosa, higiene e conforto para rosto e corpo.",
  "Estética Facial": "Protocolos faciais estéticos para limpeza, cuidado e viço da pele.",
  "Harmonização Facial": "Atendimento estético com avaliação profissional e foco em indicação adequada.",
  "Lash Designer": "Serviços para cílios com acabamento delicado e valorização do olhar.",
  "Mãos e Pés": "Manicure, pedicure e esmaltação com acabamento limpo e cuidadoso.",
  "Maquiagem": "Maquiagem profissional para rotina, eventos, formaturas e noivas.",
  "Nail Designer": "Alongamentos, gel, blindagem e manutenção para unhas com acabamento elegante.",
  "Podologia": "Cuidados técnicos para conforto e bem-estar dos pés.",
  "Sobrancelhas": "Serviços para sobrancelhas com desenho, acabamento e harmonia do olhar.",
  "SPA para os Pés": "Rituais relaxantes para pés com toque sensorial e aromático."
};

function normalizeServiceText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getHairLengthLabel(title) {
  if (title.includes("curto")) return "curto";
  if (title.includes("medio")) return "medio";
  if (title.includes("longo")) return "longo";
  return "";
}

function describeHairService(service, title) {
  const lengthLabel = getHairLengthLabel(title);
  if (title.includes("tintura")) {
    return "Aplicação de tintura trazida pela cliente, com cuidado na preparação e no acabamento dos fios.";
  }
  if (title.includes("coloracao")) {
    return `Coloração${lengthLabel ? ` para cabelo ${lengthLabel}` : ""} com tinta do salão, alinhando tom, cobertura e acabamento.`;
  }
  if (title.includes("crespo") || title.includes("cacheado")) {
    return "Corte pensado para cabelos crespos e cacheados, respeitando curvatura, volume e caimento.";
  }
  if (title.includes("corte")) {
    return "Corte de cabelo com escuta do estilo desejado, proporção e acabamento profissional.";
  }
  if (title.includes("escova")) {
    return `Escova${lengthLabel ? ` para cabelo ${lengthLabel}` : ""} com finalização polida e movimento natural.`;
  }
  if (title.includes("hidratacao")) {
    return "Hidratação capilar para cuidado dos fios, maciez e aparência bem tratada.";
  }
  if (title.includes("higienizacao")) {
    return "Higienização capilar com lavagem cuidadosa e preparo dos fios para o atendimento.";
  }
  if (title.includes("lavagem")) {
    return "Lavagem especial com ritual capilar técnico e acabamento adequado ao fio.";
  }
  if (title.includes("mechas")) {
    return "Mechas com planejamento de luminosidade, tom e cuidado com a saúde dos fios.";
  }
  if (title.includes("penteado noiva")) {
    return "Penteado para noiva com acabamento elegante e alinhado ao momento da cerimônia.";
  }
  if (title.includes("penteado formanda")) {
    return "Penteado para formatura com estrutura, acabamento e presença para evento.";
  }
  if (title.includes("realinhamento")) {
    return "Realinhamento capilar com avaliação do fio e execução técnica cuidadosa.";
  }
  if (title.includes("tratamento")) {
    return `Tratamento capilar ${service.title.replace(/^TRATAMENTO\s*/i, "")} com protocolo profissional e cuidado dos fios.`;
  }
  return serviceCopyByCategory.Cabelo;
}

function describeWaxingService(service, title) {
  const area = service.title
    .replace(/^Depilação\s+de\s+/i, "")
    .replace(/^Depilação\s+/i, "")
    .replace(/\s+-\s+.*/i, "")
    .trim();
  if (title.includes("linha")) {
    return `Depilação de ${area.replace(/ com Linha$/i, "")} com linha, feita com precisão e cuidado para a pele.`;
  }
  return `Depilação de ${area} com técnica cuidadosa, higiene e conforto em cada etapa.`;
}

function describeFacialService(service, title) {
  if (title.includes("dermaplaning")) {
    return "Dermaplaning estético para renovação superficial e acabamento suave da pele.";
  }
  if (title.includes("hydra")) {
    return "Hydra Gloss para cuidado facial com foco em hidratação, brilho e toque viçoso.";
  }
  if (title.includes("limpeza")) {
    return "Limpeza de pele com protocolo estético para higienização, cuidado e preparo da pele.";
  }
  return serviceCopyByCategory["Estética Facial"];
}

function describeHarmonizationService(service, title) {
  if (title.includes("toxina") || title.includes("botox")) {
    return "Toxina botulínica com avaliação profissional, indicação adequada e foco em naturalidade.";
  }
  if (title.includes("pdo")) {
    return "Avaliação para fios de PDO, com indicação definida em consulta profissional.";
  }
  return serviceCopyByCategory["Harmonização Facial"];
}

function describeLashService(service, title) {
  if (title.includes("extensao")) {
    return "Extensão de cílios para valorizar o olhar com curadoria de volume e acabamento.";
  }
  if (title.includes("lifting")) {
    return "Lash lifting para curvar e destacar os cílios naturais com acabamento leve.";
  }
  if (title.includes("manutencao")) {
    return "Manutenção de cílios para preservar o desenho e o acabamento da extensão.";
  }
  return serviceCopyByCategory["Lash Designer"];
}

function describeHandsFeetService(service, title) {
  if (title.includes("francesinha")) {
    return "Esmaltação francesinha com acabamento clássico, delicado e preciso.";
  }
  if (title.includes("gel top")) {
    return "Esmaltação em gel top gloss com brilho intenso e acabamento polido.";
  }
  if (title.includes("infantil")) {
    return "Esmaltação infantil com proposta leve, cuidadosa e acabamento delicado.";
  }
  if (title.includes("top coat")) {
    return "Top coat para finalização de brilho e proteção do acabamento.";
  }
  if (title.includes("maos") && title.includes("pes")) {
    return "Manicure e pedicure tradicionais com cuidado completo de mãos e pés.";
  }
  if (title.includes("manicure")) {
    return "Manicure tradicional com cuidado das mãos, cutículas e esmaltação.";
  }
  if (title.includes("pedicure")) {
    return "Pedicure tradicional com cuidado dos pés, cutículas e esmaltação.";
  }
  if (title.includes("artistica") || title.includes("decoracao")) {
    return "Unha artística com decoração personalizada e acabamento cuidadoso.";
  }
  return "Esmaltação com acabamento limpo, escolha de cor e cuidado das unhas.";
}

function describeMakeupService(service, title) {
  if (title.includes("express")) {
    return "Maquiagem express para o dia a dia, com acabamento leve e prático.";
  }
  if (title.includes("formatura")) {
    return "Maquiagem para formatura com presença, durabilidade e acabamento fotográfico.";
  }
  if (title.includes("noiva")) {
    return "Maquiagem para noiva com construção delicada, elegante e alinhada ao estilo pessoal.";
  }
  if (title.includes("social")) {
    return "Maquiagem social para eventos, encontros e ocasiões especiais.";
  }
  return serviceCopyByCategory.Maquiagem;
}

function describeNailDesignService(service, title) {
  if (title.includes("remocao")) {
    return "Remoção técnica de acabamento artificial ou esmalte em gel, com cuidado das unhas naturais.";
  }
  if (title.includes("manutencao")) {
    return "Manutenção de alongamento para preservar estrutura, acabamento e resistência.";
  }
  if (title.includes("acrilico")) {
    return "Alongamento em acrílico com construção técnica e acabamento elegante.";
  }
  if (title.includes("fibra de vidro")) {
    return "Alongamento em fibra de vidro com estrutura, naturalidade e acabamento refinado.";
  }
  if (title.includes("molde f1")) {
    return "Alongamento com molde F1 para construção uniforme e acabamento polido.";
  }
  if (title.includes("tips")) {
    return "Alongamento em tips com formato planejado e acabamento cuidadoso.";
  }
  if (title.includes("banho de gel")) {
    return "Banho de gel para reforço, brilho e acabamento das unhas naturais.";
  }
  if (title.includes("blindagem")) {
    return "Blindagem em gel para proteger e estruturar as unhas naturais.";
  }
  if (title.includes("unica")) {
    return "Colocação de unha única para correção pontual e acabamento harmônico.";
  }
  if (title.includes("unha de gel")) {
    return "Unha de gel com construção técnica, formato elegante e acabamento profissional.";
  }
  return serviceCopyByCategory["Nail Designer"];
}

function describePodologyService(service, title) {
  if (title.includes("alta frequencia")) {
    return "Aplicação de alta frequência dentro do atendimento de podologia.";
  }
  if (title.includes("assepsia")) {
    return "Assepsia técnica com cuidado profissional e foco em higiene dos pés.";
  }
  if (title.includes("calosidade")) {
    return "Atendimento para calosidade plantar com cuidado técnico e conforto.";
  }
  if (title.includes("ortese")) {
    return "Manutenção de órtese com avaliação e ajuste durante o atendimento.";
  }
  return "Atendimento de podologia para cuidado técnico, conforto e bem-estar dos pés.";
}

function describeBrowsService(service, title) {
  if (title.includes("brow lamination")) {
    return "Brow lamination para alinhar os fios e valorizar o desenho natural das sobrancelhas.";
  }
  if (title.includes("cera fria")) {
    return "Depilação de sobrancelhas com cera fria e acabamento cuidadoso.";
  }
  if (title.includes("pintura")) {
    return "Pintura de sobrancelhas para realçar o olhar com acabamento equilibrado.";
  }
  if (title.includes("pinca")) {
    return "Design de sobrancelhas na pinça, com precisão e acabamento natural.";
  }
  return serviceCopyByCategory.Sobrancelhas;
}

function describeSpaFeetService(service, title) {
  if (title.includes("escalda")) {
    return "Escalda-pés relaxante para pausa sensorial, conforto e cuidado dos pés.";
  }
  return "Spa dos pés aromático com óleo essencial, cuidado sensorial e momento de relaxamento.";
}

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

function getServiceDescription(service) {
  const title = normalizeServiceText(service.title);

  if (service.category === "Cabelo") return describeHairService(service, title);
  if (service.category === "Depilação") return describeWaxingService(service, title);
  if (service.category === "Estética Facial") return describeFacialService(service, title);
  if (service.category === "Harmonização Facial") return describeHarmonizationService(service, title);
  if (service.category === "Lash Designer") return describeLashService(service, title);
  if (service.category === "Mãos e Pés") return describeHandsFeetService(service, title);
  if (service.category === "Maquiagem") return describeMakeupService(service, title);
  if (service.category === "Nail Designer") return describeNailDesignService(service, title);
  if (service.category === "Podologia") return describePodologyService(service, title);
  if (service.category === "Sobrancelhas") return describeBrowsService(service, title);
  if (service.category === "SPA para os Pés") return describeSpaFeetService(service, title);

  return serviceCopyByCategory[service.category] || "Agende online seu atendimento no Espaço Gysa.";
}

function getServiceImage(service) {
  return `/services/service-${service.id}.webp`;
}

function getServiceImageAlt(service) {
  return `${service.category}: ${service.title} no Espaço Gysa`;
}

const services = rawServices.map((service, serviceIndex) => ({
  ...service,
  desc: getServiceDescription(service),
  durationLabel: formatDuration(service.duration),
  priceLabel: formatPrice(service.price),
  link: `${bookingBaseUrl}/${service.id}`,
  cta: "Agendar online",
  image: getServiceImage(service, serviceIndex),
  imageAlt: getServiceImageAlt(service)
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
          <img src="${item.image}" alt="${item.imageAlt}" class="explorer-card-image" ${imageLoading} decoding="async">
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
  if (modalImage) modalImage.alt = item.imageAlt;
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
let isStoryMuted = false;
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

const storyDurations = [40000, 23000, 40000, 8000, 8000, 18000];

function getStoryCount() {
  return document.querySelectorAll(".story-slide").length;
}

function getActiveStoryVideo() {
  return document.querySelector(`#story-slide-${activeStoryIndex} .story-video-player`);
}

function applyStoryAudioState() {
  document.querySelectorAll(".story-video-player").forEach((video) => {
    video.muted = isStoryMuted;
    video.volume = isStoryMuted ? 0 : 1;
  });
}

function playActiveStoryVideo() {
  const activeVideo = getActiveStoryVideo();
  if (!activeVideo || isStoryPaused) return;

  activeVideo.muted = isStoryMuted;
  activeVideo.volume = isStoryMuted ? 0 : 1;
  activeVideo.play().catch((err) => {
    if (!isStoryMuted) {
      isStoryMuted = true;
      applyStoryAudioState();
      updateSoundUI();
      activeVideo.play().catch(() => {});
      return;
    }
  });
}

function updateStoryVideos() {
  document.querySelectorAll(".story-video-player").forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });

  applyStoryAudioState();
  playActiveStoryVideo();
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

function updateSoundUI() {
  const btn = document.getElementById("story-sound-btn");
  if (!btn) return;
  const iconVolumeOff = btn.querySelector(".icon-volume-off");
  const iconVolumeOn = btn.querySelector(".icon-volume-on");

  if (isStoryMuted) {
    if (iconVolumeOff) iconVolumeOff.style.display = "block";
    if (iconVolumeOn) iconVolumeOn.style.display = "none";
    btn.classList.remove("is-sound-on");
    btn.setAttribute("aria-label", "Ativar som do Story");
  } else {
    if (iconVolumeOff) iconVolumeOff.style.display = "none";
    if (iconVolumeOn) iconVolumeOn.style.display = "block";
    btn.classList.add("is-sound-on");
    btn.setAttribute("aria-label", "Silenciar Story");
  }
}

function toggleStorySound(event) {
  if (event) event.stopPropagation();
  isStoryMuted = !isStoryMuted;
  applyStoryAudioState();
  updateSoundUI();
  playActiveStoryVideo();
}

function toggleStoryPlay() {
  isStoryPaused = !isStoryPaused;
  updatePlayPauseUI();

  const activeVideo = getActiveStoryVideo();
  if (activeVideo) {
    if (isStoryPaused) activeVideo.pause();
    else playActiveStoryVideo();
  }
}

function openStory(index, event) {
  if (event) event.stopPropagation();
  activeStoryIndex = index;
  isStoryPaused = false;
  isStoryMuted = false;
  
  const modal = document.getElementById("story-modal");
  if (!modal) return;
  modal.classList.add("active");

  // Ajusta o link da ação do Instagram
  const instaLinkBtn = modal.querySelector(".story-insta-btn");
  if (instaLinkBtn && storyInstagramLinks[activeStoryIndex]) {
    instaLinkBtn.href = storyInstagramLinks[activeStoryIndex];
  }

  updateSoundUI();
  updateStoryVideos();
  updateStorySlides();
  resetStoryProgress();
  startStoryTimer();
}

function closeStory() {
  const modal = document.getElementById("story-modal");
  if (modal) modal.classList.remove("active");
  
  isStoryPaused = false;

  document.querySelectorAll(".story-video-player").forEach((video) => video.pause());
  
  if (storyTimer) {
    clearInterval(storyTimer);
    storyTimer = null;
  }
}

function nextStory() {
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
}

function prevStory() {
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
}

function updateStorySlides() {
  const slides = document.querySelectorAll(".story-slide");
  slides.forEach((slide, idx) => {
    if (idx === activeStoryIndex) {
      slide.classList.add("active");
    } else {
      slide.classList.remove("active");
    }
  });

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
  updateSoundUI();
  
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
window.openStory = openStory;
window.closeStory = closeStory;
window.toggleStoryPlay = toggleStoryPlay;
window.toggleStorySound = toggleStorySound;
window.selectCategory = selectCategory;
window.goToSlide = goToSlide;
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;
window.modalNav = modalNav;

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
