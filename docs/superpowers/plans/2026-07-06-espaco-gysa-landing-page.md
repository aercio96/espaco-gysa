# Espaço Gysa Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a luxurious landing page for Espaço Gysa with immersive fullscreen video scrollytelling scrubbed smoothly via GSAP and a custom Lerp loop.

**Architecture:** A lightweight single-page layout using Vite. A fixed fullscreen background video with a darkening overlay is scrubbed via a requestAnimationFrame Lerp loop mapping the scroll position. Text sections fade in/out exactly synced with the scroll progress.

**Tech Stack:** HTML5, CSS3, Vite, JavaScript, GSAP, GSAP ScrollTrigger.

---

### Task 1: Project Setup and Dependencies

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json with dependencies**
  Write package configuration including `vite` and `gsap`.
  ```json
  {
    "name": "espaco-gysa-landing-page",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "gsap": "^3.12.5"
    },
    "devDependencies": {
      "vite": "^5.2.0"
    }
  }
  ```

- [ ] **Step 2: Create .gitignore**
  ```
  node_modules
  dist
  .superpowers
  .DS_Store
  ```

- [ ] **Step 3: Run npm install**
  Run `npm install` to setup the local environment.
  Run: `npm install` in workspace root.
  Expected: Success, creating `node_modules`.

- [ ] **Step 4: Commit setup**
  ```bash
  git init
  git add package.json .gitignore
  git commit -m "chore: initial project setup"
  ```

---

### Task 2: Copy Video File to Assets

**Files:**
- Create: `public/Beauty_salon_space_diversity_202607061652.mp4`

- [ ] **Step 1: Copy the source video**
  Copy the mp4 file from `C:\Users\aerci\Downloads\Beauty_salon_space_diversity_202607061652.mp4` to the project's `public/` directory (created automatically).
  Expected: File exists at `c:\Users\aerci\Documents\espaço gysa\public\Beauty_salon_space_diversity_202607061652.mp4` with a non-zero file size.

- [ ] **Step 2: Commit video**
  ```bash
  git add public/Beauty_salon_space_diversity_202607061652.mp4
  git commit -m "media: add beauty salon scrollytelling background video"
  ```

---

### Task 3: HTML Structure (SEO and Semantics)

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create HTML structure**
  Implement the full HTML with proper layout triggers and semantic tags.
  ```html
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Espaço Gysa | Beleza e Bem-Estar - Asa Norte Brasília</title>
    <meta name="description" content="Venha viver uma experiência sensorial única no Espaço Gysa. Serviços de cabelos, cachos, estética avançada, maquiagem e unhas com sofisticação em Brasília.">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/src/style.css">
  </head>
  <body>

    <!-- Container do vídeo de fundo fixed -->
    <div class="video-container">
      <video id="bg-video" src="/Beauty_salon_space_diversity_202607061652.mp4" playsinline muted preload="auto"></video>
      <div class="video-overlay"></div>
    </div>

    <!-- Container fixo para as seções de texto flutuantes -->
    <main class="content-overlay">
      
      <!-- Seção 1: O Despertar -->
      <section class="text-slide active" id="slide-despertar">
        <header class="logo-header">
          <img src="/logo/715079342_18105654004890053_2049181529465052405_n-removebg-preview.png" alt="Espaço Gysa Logo" class="brand-logo">
        </header>
        <div class="slide-body">
          <h1 class="main-title">GYSA<br><span class="subtitle-brand">BELEZA E BEM-ESTAR</span></h1>
          <p class="slide-text">"Um novo conceito de autoestima, cuidado e alta sofisticação. Venha viver uma experiência sensorial única, minuciosamente desenhada para você."</p>
        </div>
      </section>

      <!-- Seção 2: O Manifesto -->
      <section class="text-slide" id="slide-manifesto">
        <div class="slide-body">
          <h2 class="manifesto-title">Beleza que transforma.<br>Cuidado que acolhe.<br><span class="gold-highlight">Você em sua melhor versão.</span></h2>
        </div>
      </section>

      <!-- Seção 3: Vitrine de Serviços -->
      <section class="text-slide" id="slide-servicos">
        <div class="slide-body wide-body">
          <h2 class="section-title">Nossos Serviços</h2>
          <div class="services-grid">
            <div class="service-card">
              <h3>Cabelos & Cachos</h3>
              <p>Corte, cor e tratamentos que esculpem sua identidade.</p>
            </div>
            <div class="service-card">
              <h3>Estética Avançada</h3>
              <p>A ciência do rejuvenescimento unida à sutil arte da naturalidade.</p>
            </div>
            <div class="service-card">
              <h3>Maquiagem & Sobrancelhas</h3>
              <p>O realce preciso dos seus traços mais marcantes.</p>
            </div>
            <div class="service-card">
              <h3>Unhas & Depilação</h3>
              <p>O cuidado milimétrico em cada detalhe do seu bem-estar.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Seção 4: Pilares de Excelência -->
      <section class="text-slide" id="slide-pilares">
        <div class="slide-body wide-body">
          <h2 class="section-title">Pilares de Excelência</h2>
          <div class="pilares-grid">
            <div class="pilar-card">
              <span class="pilar-num">01</span>
              <h3>Profissionais Especializados</h3>
              <p>Uma curadoria dos melhores talentos técnicos para cuidar de você.</p>
            </div>
            <div class="pilar-card">
              <span class="pilar-num">02</span>
              <h3>Produtos de Alta Qualidade</h3>
              <p>Rituais executados exclusivamente com marcas globais de prestígio internacional.</p>
            </div>
            <div class="pilar-card">
              <span class="pilar-num">03</span>
              <h3>Ambiente Acolhedor</h3>
              <p>Um refúgio de luxo minimalista focado no seu relaxamento absoluto.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Seção 5: O Convite e Rodapé -->
      <section class="text-slide" id="slide-convite">
        <div class="slide-body wide-body footer-slide">
          <div class="badge-inauguracao">Inauguração Especial</div>
          <h2 class="cta-title">Sua melhor versão começa aqui.</h2>
          <p class="badge-subtext">Aproveite as condições especiais de inauguração por tempo limitado.</p>
          
          <a href="https://wa.me/5561998461559" target="_blank" rel="noopener" class="cta-button" aria-label="Fazer agendamento via WhatsApp">
            FAÇA SEU AGENDAMENTO AGORA
          </a>

          <footer class="footer-details">
            <div class="address-box">
              <h4>Endereço</h4>
              <p>SHN Q.2 Bloco J, Área Externa, Garvey Park Hotel - Asa Norte, Brasília/DF.</p>
            </div>
            
            <div class="contacts-box">
              <h4>Contatos</h4>
              <p>(61) 99846-1559 | @espacogysadf</p>
            </div>

            <div class="qr-card">
              <div class="qr-code-placeholder">
                <!-- Vamos desenhar um SVG elegante de QR Code para ficar totalmente texturizado em dourado -->
                <svg width="60" height="60" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2zm6-2h1v1H8V0zm0 2h2v1H8V2zm1 1h1v3H9V3zm-1 3h1v1H8V6zm3-6h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2zm6-2h1v1h-1V0zm0 2h1v1h-1V2zm0 2h1v3h-1V4zm-8 4h1v1h-1V8zm2 0h1v1h-1V8zm2 0h1v1h-1V8zm2 0h1v1h-1V8zm1 1h1v2h-1V9zm-5 1h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v2h-1v-2zm-6 2h1v1h-1v-1zm2 0h1v1h-1v-1zm4 0h1v1h-1v-1zm-6 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-8 1h7v7H0v-7zm1 1v5h5V15H1zm1 1h3v3H2v-3zm6 0h1v1H8v-1zm0 2h2v1H8v-1zm1 1h1v3H9v-3zm-1 3h1v1H8v-1zm3-6h1v1h-1v-1zm2 0h1v1h-1v-1zm1 0h2v1h-2v-1zm3 0h1v3h-1v-3zm-6 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-4 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm1 1h1v1h-1v-1z" fill="#BFA87E"/>
                </svg>
              </div>
              <p>Aponte a câmera para iniciar o atendimento direto via WhatsApp.</p>
            </div>
          </footer>
        </div>
      </section>

    </main>

    <!-- Scroll Track Invisível para controlar o ScrollTrigger -->
    <div class="scroll-tracker"></div>

    <script type="module" src="/src/main.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit HTML**
  ```bash
  git add index.html
  git commit -m "feat: add semantic HTML structure and SEO meta tags"
  ```

---

### Task 4: CSS Styles (Design System, Colors, and Typography)

**Files:**
- Create: `src/style.css`

- [ ] **Step 1: Write css styles**
  Define visual variables and styles according to copywriting branding manifesto.
  ```css
  :root {
    /* 60% Colors - Background & Off-White */
    --color-bg-base: #D8D9D7;
    --color-text-off: #F4F4F4;
    --color-panel-dark: rgba(0, 0, 0, 0.55);

    /* 30% Colors - Structure & Branding */
    --color-musa-rose: #A65170;
    --color-deep-burgundy: #8C4558;

    /* 10% Colors - Lux Details & Highlights */
    --color-gold-classic: #A68053;
    --color-gold-champagne: #BFA87E;

    /* Fonts */
    --font-title: 'Playfair Display', serif;
    --font-body: 'Montserrat', sans-serif;
  }

  /* Reset & General Setup */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    background-color: var(--color-bg-base);
    color: var(--color-text-off);
    font-family: var(--font-body);
    overflow-x: hidden;
    height: 100%;
    overscroll-behavior-y: none;
  }

  /* Fixed Background Video */
  .video-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    overflow: hidden;
  }

  .video-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.7));
    z-index: 2;
  }

  /* Scroll Tracker - invisible height to drive GSAP */
  .scroll-tracker {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 500vh; /* 5 slides x 100vh */
    pointer-events: none;
    z-index: 0;
  }

  /* Flipped Layout Overlay */
  .content-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10;
    pointer-events: none; /* Let pointer events go to button links */
  }

  .text-slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    opacity: 0;
    visibility: hidden;
    transition: visibility 0s 0.3s;
    pointer-events: none;
  }

  .text-slide.active {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.4s ease-out, visibility 0s 0s;
  }

  .text-slide * {
    pointer-events: auto; /* Enable clicks inside active slide elements */
  }

  .slide-body {
    max-width: 650px;
    text-align: center;
  }

  .slide-body.wide-body {
    max-width: 950px;
  }

  /* Slide 1 - Logo & Title */
  .logo-header {
    position: absolute;
    top: 5vh;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }

  .brand-logo {
    max-height: 80px;
    width: auto;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
  }

  .main-title {
    font-family: var(--font-title);
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: 4px;
    color: #fff;
    text-shadow: 0 4px 15px rgba(0,0,0,0.6);
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }

  .subtitle-brand {
    font-family: var(--font-title);
    font-size: 1.25rem;
    font-weight: 400;
    font-style: italic;
    letter-spacing: 6px;
    color: var(--color-gold-champagne);
    display: block;
    margin-top: 5px;
  }

  .slide-text {
    font-size: 0.95rem;
    line-height: 1.7;
    font-weight: 300;
    color: var(--color-bg-base);
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  /* Slide 2 - Manifesto */
  .manifesto-title {
    font-family: var(--font-title);
    font-size: 2.25rem;
    line-height: 1.4;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 4px 15px rgba(0,0,0,0.6);
  }

  .gold-highlight {
    color: var(--color-gold-champagne);
    font-style: italic;
    font-family: var(--font-title);
    display: block;
    margin-top: 10px;
  }

  /* Section Titles */
  .section-title {
    font-family: var(--font-title);
    font-size: 2.2rem;
    color: #fff;
    text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    margin-bottom: 2rem;
    letter-spacing: 2px;
  }

  /* Slide 3 - Services Grid */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    width: 100%;
  }

  .service-card {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(191, 168, 126, 0.15);
    border-radius: 12px;
    padding: 1.75rem;
    text-align: left;
    backdrop-filter: blur(8px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .service-card:hover {
    border-color: var(--color-gold-champagne);
    transform: translateY(-4px);
    background: rgba(140, 69, 88, 0.2); /* Deep Burgundy tint */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .service-card h3 {
    font-family: var(--font-title);
    font-size: 1.25rem;
    color: var(--color-gold-champagne);
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .service-card p {
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--color-bg-base);
    font-weight: 300;
  }

  /* Slide 4 - Pilares Grid */
  .pilares-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    width: 100%;
  }

  .pilar-card {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(191, 168, 126, 0.15);
    border-radius: 12px;
    padding: 2rem 1.5rem;
    text-align: center;
    backdrop-filter: blur(8px);
    position: relative;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pilar-card:hover {
    border-color: var(--color-gold-champagne);
    transform: translateY(-4px);
    background: rgba(166, 81, 112, 0.15); /* Musa Rose tint */
  }

  .pilar-num {
    display: block;
    font-family: var(--font-title);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-gold-champagne);
    opacity: 0.7;
    margin-bottom: 0.75rem;
  }

  .pilar-card h3 {
    font-family: var(--font-title);
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: #fff;
  }

  .pilar-card p {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-bg-base);
    font-weight: 300;
  }

  /* Slide 5 - Footer & CTA */
  .footer-slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 4vh;
  }

  .badge-inauguracao {
    background: rgba(140, 69, 88, 0.8);
    border: 1px solid var(--color-gold-classic);
    color: var(--color-gold-champagne);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 3px;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .cta-title {
    font-family: var(--font-title);
    font-size: 2.5rem;
    color: #fff;
    margin-bottom: 0.5rem;
    text-shadow: 0 4px 15px rgba(0,0,0,0.5);
  }

  .badge-subtext {
    font-size: 0.9rem;
    color: var(--color-bg-base);
    margin-bottom: 2rem;
    font-weight: 300;
  }

  .cta-button {
    background: linear-gradient(135deg, var(--color-gold-classic), var(--color-gold-champagne));
    color: #000;
    padding: 1rem 2.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: 2px;
    box-shadow: 0 6px 20px rgba(166, 128, 83, 0.3);
    transition: all 0.3s ease;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(166, 128, 83, 0.5);
    filter: brightness(1.1);
  }

  /* Institutional Footer details */
  .footer-details {
    margin-top: 3.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    border-top: 1px solid rgba(216, 217, 215, 0.15);
    padding-top: 1.5rem;
  }

  .address-box, .contacts-box {
    flex: 1;
    text-align: left;
    max-width: 320px;
  }

  .contacts-box {
    margin-left: 2rem;
  }

  .footer-details h4 {
    font-family: var(--font-title);
    color: var(--color-gold-champagne);
    font-size: 0.85rem;
    letter-spacing: 1px;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
  }

  .footer-details p {
    font-size: 0.75rem;
    color: var(--color-bg-base);
    line-height: 1.5;
    font-weight: 300;
  }

  /* QR Code Card */
  .qr-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(191, 168, 126, 0.25);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 320px;
    backdrop-filter: blur(4px);
  }

  .qr-code-placeholder {
    background: #fff;
    padding: 6px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  .qr-card p {
    font-size: 0.68rem;
    color: var(--color-bg-base);
    line-height: 1.4;
    font-weight: 300;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .main-title {
      font-size: 2.2rem;
    }
    .manifesto-title {
      font-size: 1.6rem;
    }
    .section-title {
      font-size: 1.6rem;
      margin-bottom: 1.25rem;
    }
    .services-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .service-card {
      padding: 1.25rem;
    }
    .pilares-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .pilar-card {
      padding: 1.25rem;
    }
    .cta-title {
      font-size: 1.75rem;
    }
    .cta-button {
      padding: 0.8rem 1.75rem;
      font-size: 0.75rem;
    }
    .footer-slide {
      margin-top: 1vh;
    }
    .footer-details {
      flex-direction: column;
      gap: 1.25rem;
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
    }
    .address-box, .contacts-box {
      text-align: center;
      margin-left: 0;
      max-width: 100%;
    }
    .qr-card {
      max-width: 100%;
    }
  }

  @media (max-height: 600px) {
    .brand-logo {
      max-height: 50px;
    }
    .main-title {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }
    .section-title {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
    }
    .services-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .service-card {
      padding: 0.75rem;
    }
    .service-card h3 {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    .pilar-card {
      padding: 0.75rem;
    }
    .pilar-card h3 {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    .pilar-num {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }
    .cta-title {
      font-size: 1.4rem;
    }
    .cta-button {
      padding: 0.6rem 1.5rem;
    }
    .footer-details {
      margin-top: 1rem;
      padding-top: 0.5rem;
    }
  }
  ```

- [ ] **Step 2: Commit CSS**
  ```bash
  git add src/style.css
  git commit -m "style: implement brand identity, responsive grids, and font faces"
  ```

---

### Task 5: JS Implementation (GSAP, ScrollTrigger, and Lerp Scrubbing Loop)

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Write main.js logic**
  Implement GSAP ScrollTrigger bindings along with requestAnimationFrame loop for Lerp-smoothed video currentTime interpolation.
  ```javascript
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
  ```

- [ ] **Step 2: Commit JS**
  ```bash
  git add src/main.js
  git commit -m "feat: implement GSAP scrolltrigger and requestAnimationFrame Lerp loop for video scrubbing"
  ```

---

### Task 6: Local Validation and Final Polish

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify production build succeeds**
  Build production files with Vite to ensure no syntax/bundling errors exist.
  Run: `npm run build`
  Expected: Production bundle created successfully inside `dist/`.

- [ ] **Step 2: Commit build validation**
  ```bash
  git commit -am "chore: validate production build configuration"
  ```
