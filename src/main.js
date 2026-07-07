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
  // Isso compila os shaders e aloca memória imediatamente para evitar travamentos no scroll
  initVanta();

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
      scrub: 0.5 // Suavização do scroll para uma experiência amanteigada
    }
  });

  // Vincula ativação dos indicadores para 6 slides
  mainTimeline.call(setActiveIndicator, [0], 0.0)
              .call(setActiveIndicator, [1], 0.18)
              .call(setActiveIndicator, [2], 0.36)
              .call(setActiveIndicator, [3], 0.56)
              .call(setActiveIndicator, [4], 0.76) /* Alinhado ao início do Slide 5 */
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

  // Transição do Vídeo para o Vanta.js Clouds background (suavizada para 0.10 de duração)
  mainTimeline.to("#vanta-bg", { opacity: 1, autoAlpha: 1, duration: 0.10 }, 0.70)
              .to(".video-container", { opacity: 0, duration: 0.10 }, 0.70);

  // Slide 5 (Atmosfera Gysa - Nuvem Background) surge e desaparece (início sincronizado na transição)
  mainTimeline.to("#slide-atmosfera", { opacity: 1, autoAlpha: 1, pointerEvents: "auto", duration: 0.06 }, 0.75)
              .to("#slide-atmosfera .slide-body", { y: 0, duration: 0.06 }, 0.75)
              .to("#slide-atmosfera", { opacity: 0, autoAlpha: 0, pointerEvents: "none", duration: 0.06 }, 0.85)
              .to("#slide-atmosfera .slide-body", { y: -40, duration: 0.06 }, 0.85);

  // Slide 6 (Convite/Rodapé - Nuvem Background) surge e permanece ativo
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
const services = [
  { id: 1, category: "Cabelos", title: "Corte, Tratamentos & Cachos", desc: "Cortes modernos, transição capilar, terapia capilar, hidratação profunda e reconstrução para fios saudáveis e brilhantes.", duration: "40–120 min", price: "a partir de R$ 90", cta: "Agendar agora", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=900&auto=format&fit=crop" },
  { id: 2, category: "Estética", title: "Limpeza de Pele & Protocolos", desc: "Protocolos faciais personalizados, limpeza de pele profunda, drenagem linfática e massagens corporais relaxantes.", duration: "50–90 min", price: "a partir de R$ 120", cta: "Agendar sessão", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=900&auto=format&fit=crop" },
  { id: 3, category: "Unhas", title: "Manicure, Pedicure & Alongamento", desc: "Esmaltação em gel de alta durabilidade, alongamento em fibra e rituais de spa exclusivos para mãos e pés.", duration: "45–90 min", price: "a partir de R$ 50", cta: "Agendar horário", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=900&auto=format&fit=crop" },
  { id: 4, category: "Sobrancelhas", title: "Design, Henna & Cílios", desc: "Design geométrico personalizado de sobrancelhas, aplicação de henna, brow lamination e lash lifting para valorizar o olhar.", duration: "30–75 min", price: "a partir de R$ 45", cta: "Agendar design", image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?q=80&w=900&auto=format&fit=crop" },
  { id: 5, category: "Maquiagem", title: "Maquiagem Social & Eventos", desc: "Makes sofisticadas com produtos importados de alta fixação para casamentos, formaturas, ensaios fotográficos e festas.", duration: "60–90 min", price: "a partir de R$ 150", cta: "Agendar make", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=900&auto=format&fit=crop" }
];

const categories = ["Todos", "Cabelos", "Estética", "Unhas", "Sobrancelhas", "Maquiagem"];
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
    return `
      <div onclick="openServiceModal(${idx})" class="service-explorer-card-item animate-fade-up">
        <div class="explorer-card-bg-container">
          <img src="${item.image}" alt="${item.title}" class="explorer-card-image" loading="lazy">
          <div class="explorer-card-overlay"></div>
        </div>
        <div class="explorer-card-badge">
          <span class="text-rose-400">✦</span> ${item.category}
        </div>
        <div class="explorer-card-content">
          <h3 class="explorer-card-title">${item.title}</h3>
          <p class="explorer-card-desc">${item.desc}</p>
          <div class="explorer-card-meta">
            <span>⏱ ${item.duration}</span>
            <span class="explorer-card-price">${item.price}</span>
          </div>
          <button class="explorer-card-btn">${item.cta}</button>
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
  const modalCta = document.getElementById("modal-whatsapp-cta");
  
  if (modalImage) modalImage.src = item.image;
  if (modalCategory) modalCategory.innerHTML = `<span class="text-rose-400">✦</span> ${item.category}`;
  if (modalTitle) modalTitle.innerText = item.title;
  if (modalDesc) modalDesc.innerText = item.desc;
  if (modalDuration) modalDuration.innerText = `⏱ Duração: ${item.duration}`;
  if (modalPrice) modalPrice.innerText = item.price;
  
  if (modalCta) {
    const textMsg = encodeURIComponent(`Olá! Vi no site o serviço "${item.title}" e gostaria de solicitar um agendamento.`);
    modalCta.href = `https://wa.me/5561998461559?text=${textMsg}`;
  }
}

// Binda funções ao escopo global (window) para os handlers onclick do HTML
window.selectCategory = selectCategory;
window.goToSlide = goToSlide;
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;
window.modalNav = modalNav;

// Inicializa a timeline assim que o DOM estiver carregado
window.addEventListener("DOMContentLoaded", initAnimations);
