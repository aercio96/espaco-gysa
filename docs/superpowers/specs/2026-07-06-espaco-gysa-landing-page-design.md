# Especificação de Design - Landing Page Espaço Gysa
**Data:** 2026-07-06
**Status:** Aprovado pelo Usuário
**Autor:** Antigravity (Google DeepMind Team)

---

## 1. Visão Geral do Projeto

Este projeto consiste no desenvolvimento de uma landing page institucional premium para o **Espaço Gysa - Beleza e Bem-Estar**. O site será focado em uma experiência imersiva de *scrollytelling*, na qual a rolagem da página controla o progresso (scrubbing) de um vídeo de fundo em alta definição, e as seções de texto aparecem como overlays diretos sobre o vídeo com animações de fade in e fade out.

A experiência será fluida (smooth scrolling) usando o ecossistema GSAP (GreenSock Animation Platform) e ScrollTrigger, integrada a uma técnica de interpolação linear (Lerp) via código JavaScript para eliminar os travamentos de frame causados por decodificação de vídeo do navegador.

---

## 2. Tecnologias Utilizadas

* **Pilha Principal:** HTML5 semântico e CSS3 Vanilla (sem Tailwind, seguindo os padrões do projeto).
* **Ambiente de Desenvolvimento & Build:** Vite com gerenciamento de dependências via npm.
* **Mecanismo de Animação:** GSAP + GSAP ScrollTrigger.
* **Tipografia:** Google Fonts (Playfair Display para títulos, Montserrat para corpo do texto).
* **Mídia:** Vídeo MP4 local codificado em alta taxa de frames e keyframes frequentes.

---

## 3. Estrutura de Arquivos do Projeto

Os arquivos serão criados e estruturados no seguinte formato:

```
espaço gysa/
├── .gitignore
├── index.html                   # Estrutura HTML5 com otimização SEO
├── package.json                 # Definição de scripts de build e dependências (gsap, vite)
├── logo/
│   └── 715079342_18105654004890053_2049181529465052405_n-removebg-preview.png # Logotipo do Espaço Gysa
├── public/
│   └── Beauty_salon_space_diversity_202607061652.mp4  # Vídeo copiado do diretório de downloads
└── src/
    ├── main.js                  # Inicialização das bibliotecas e loop Lerp de vídeo
    └── style.css                # Variáveis de design, reset e estilos do layout fixo
```

---

## 4. Estrutura do Layout e Seções do Site

O layout usará um contêiner de vídeo fixado em 100vh com `object-fit: cover` para preencher toda a tela, com uma camada semi-transparente escura (overlay) para garantir o contraste do texto. Cada seção do site aparecerá como uma sobreposição de texto que transiciona via fade in/out com base no scroll:

### Seção 1: O Despertar
* **Gatilho de Scroll:** 0% a 20%
* **Design:** Logotipo e menu minimalista no topo. Título central em destaque com o H1 principal "GYSA - BELEZA E BEM-ESTAR".
* **Texto:** "Um novo conceito de autoestima, cuidado e alta sofisticação. Venha viver uma experiência sensorial única, minuciosamente desenhada para você."

### Seção 2: O Manifesto da Diversidade
* **Gatilho de Scroll:** 20% a 45%
* **Design:** Frase de transição flutuando sutilmente no centro/laterais enquanto as modelos aparecem no vídeo.
* **Texto:** "Beleza que transforma. Cuidado que acolhe. Você em sua melhor versão."

### Seção 3: Vitrine de Serviços
* **Gatilho de Scroll:** 45% a 70%
* **Design:** Título "Nossos Serviços" seguido de uma grade estilizada de 4 cards minimalistas de serviços com efeito hover que destaca as bordas em dourado metálico.
* **Categorias:**
  * **Cabelos & Cachos:** "Corte, cor e tratamentos que esculpem sua identidade."
  * **Estética Avançada & Harmonização Facial:** "A ciência do rejuvenescimento unida à sutil arte da naturalidade."
  * **Maquiagem & Sobrancelhas:** "O realce preciso dos seus traços mais marcantes."
  * **Unhas & Depilação:** "O cuidado milimétrico em cada detalhe do seu bem-estar."

### Seção 4: Pilares de Excelência
* **Gatilho de Scroll:** 70% a 90%
* **Design:** Três blocos interativos alinhados de forma elegante com bordas douradas.
* **Conteúdo:**
  * **Profissionais Especializados:** "Uma curadoria dos melhores talentos técnicos para cuidar de você."
  * **Produtos de Alta Qualidade:** "Rituais executados exclusivamente com marcas globais de prestígio internacional."
  * **Ambiente Acolhedor:** "Um refúgio de luxo minimalista focado no seu relaxamento absoluto."

### Seção 5: O Convite e Rodapé Institucional
* **Gatilho de Scroll:** 90% a 100%
* **Design:** Chamada principal em destaque. Botão CTA interativo com gradiente ouro metálico. Rodapé minimalista com endereço, contato e um micro-card texturizado em dourado contendo um QR-Code funcional apontando para o WhatsApp do Espaço Gysa.
* **Textos:**
  * **CTA:** "Sua melhor versão começa aqui."
  * **Botão:** `[ FAÇA SEU AGENDAMENTO AGORA ]`
  * **Inauguração:** "Aproveite as condições especiais de inauguração por tempo limitado."
  * **Endereço:** "SHN Q.2 Bloco J, Área Externa, Garvey Park Hotel - Asa Norte, Brasília/DF."
  * **Contatos:** "(61) 99846-1559 | @espacogysadf"
  * **QR-Code:** "Aponte a câmera para ler o QR-Code e iniciar seu atendimento direto via WhatsApp." (Direcionando para `https://wa.me/5561998461559`)

---

## 5. Diretrizes de Design de Código (GSAP & Lerp Loop)

Para contornar o problema de gagueira de vídeo em navegadores durante o scrubbing, a lógica do `src/main.js` implementará o seguinte fluxo de renderização:

```javascript
// Variáveis do Lerp
let srcVideo = document.getElementById("bg-video");
let targetTime = 0;
let currentTime = 0;
const easeFactor = 0.08; // Suavização do movimento

// Atualiza o tempo do vídeo suavemente a cada frame
function updateVideoScrub() {
  currentTime += (targetTime - currentTime) * easeFactor;
  
  // Impede flutuações e erros de limite do elemento video
  if (Math.abs(targetTime - currentTime) > 0.001 && srcVideo.duration) {
    srcVideo.currentTime = Math.min(Math.max(currentTime, 0), srcVideo.duration - 0.01);
  }
  requestAnimationFrame(updateVideoScrub);
}

// Configuração GSAP ScrollTrigger para atualizar o targetTime
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
  trigger: ".scroll-container",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    if (srcVideo.duration) {
      targetTime = self.progress * srcVideo.duration;
    }
  }
});

// Inicialização do loop
requestAnimationFrame(updateVideoScrub);
```

---

## 6. Sistema de Design (CSS Variables)

```css
:root {
  /* 60% - Cores de Fundo / Off-White */
  --color-bg-base: #D8D9D7;
  --color-text-off: #F4F4F4;

  /* 30% - Estrutura e Identidade */
  --color-musa-rose: #A65170;
  --color-deep-burgundy: #8C4558;

  /* 10% - Destaques e Luxo */
  --color-gold-classic: #A68053;
  --color-gold-champagne: #BFA87E;

  /* Fontes */
  --font-title: 'Playfair Display', serif;
  --font-body: 'Montserrat', sans-serif;
}
```

---

## 7. SEO e Acessibilidade (Critérios de Sucesso)

1. **Meta Descrição SEO:** "Conheça o Espaço Gysa em Brasília. Um novo conceito de beleza e bem-estar. Venha viver uma experiência sensorial única com cabelos, cachos, estética avançada, maquiagem e unhas."
2. **Tags de Imagem e Logo:** Adicionar o alt descritivo em todos os logotipos e imagens ("Logotipo Oficial Espaço Gysa - Beleza e Bem-Estar").
3. **Botão de Agendamento:** O botão conterá a tag `aria-label="Fazer agendamento de serviços via WhatsApp"` para acessibilidade técnica de leitores de tela.
4. **Semântica:** Divisão clara com `<header>`, `<main>`, `<section>` e `<footer>`.
