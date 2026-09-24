/**
 * DAME LA LETRA — Official Brand Landing Experience
 * Interactive Demo, Modal Controller, and Direct Connection Gateway
 */

document.addEventListener("DOMContentLoaded", () => {
  // Brand Phone Number for Louisville
  const DML_PHONE = "+15026731333";
  const DML_WA_BASE = "https://wa.me/15026731333";

  // =========================================================================
  // 1. HERO INTERACTIVE DEMO CONTROLLER
  // =========================================================================
  const demoStream = document.getElementById("demo-chat-stream");
  const demoInput = document.getElementById("demo-input-field");
  const demoSendBtn = document.getElementById("demo-send-btn");
  const demoChips = document.querySelectorAll(".demo-chip-btn");

  const DEMO_SCENARIOS = {
    "goma": {
      provider: "Roberto González (Gomas & Grúa 502)",
      eta: "15-20 minutos cerca de Shively / Dixie",
      price: "$65 - $80",
      category: "AUTOMOTRIZ / GRÚA"
    },
    "aire": {
      provider: "Carlos Ruiz (HVAC / Climatización)",
      eta: "Disponible hoy después de las 12:00 PM",
      price: "Diagnóstico estándar desde $75",
      category: "HVAC & REFRIGERACIÓN"
    },
    "arbol": {
      provider: "Yoelvis Silva (Árboles & Yard Service)",
      eta: "Visita y estimado gratuito hoy en la tarde",
      price: "Según tamaño y cercanía a líneas",
      category: "TREE SERVICE"
    },
    "comida": {
      provider: "Sabor Criollo Catering Louisville",
      eta: "Reserva confirmada para fin de semana",
      price: "Cotización por plato / menú completo",
      category: "COMIDA & EVENTOS"
    },
    "default": {
      provider: "Profesional Verificado de la Red DML",
      eta: "Respuesta en menos de 20 minutos",
      price: "Tarifa directa sin intermediarios inflados",
      category: "SERVICIO LOCAL LOUISVILLE"
    }
  };

  function matchScenario(text) {
    const lower = (text || "").toLowerCase();
    if (lower.includes("goma") || lower.includes("ponch") || lower.includes("llanta") || lower.includes("grua") || lower.includes("grúa")) {
      return DEMO_SCENARIOS.goma;
    }
    if (lower.includes("aire") || lower.includes("hvac") || lower.includes("frio") || lower.includes("enfria") || lower.includes("calor")) {
      return DEMO_SCENARIOS.aire;
    }
    if (lower.includes("arbol") || lower.includes("árbol") || lower.includes("rama") || lower.includes("yard") || lower.includes("patio")) {
      return DEMO_SCENARIOS.arbol;
    }
    if (lower.includes("comida") || lower.includes("cuban") || lower.includes("catering") || lower.includes("fiesta") || lower.includes("asado")) {
      return DEMO_SCENARIOS.comida;
    }
    return DEMO_SCENARIOS.default;
  }

  function appendDemoBubble(text, isUser = false) {
    if (!demoStream) return;
    const bubble = document.createElement("div");
    bubble.className = isUser ? "demo-bubble user-bubble" : "demo-bubble dml-bubble";
    bubble.textContent = text;
    demoStream.appendChild(bubble);
    demoStream.scrollTop = demoStream.scrollHeight;
  }

  function handleDemoSubmit(customText = null) {
    const text = customText || (demoInput ? demoInput.value.trim() : "");
    if (!text) return;

    if (demoInput) demoInput.value = "";

    // 1. User bubble
    appendDemoBubble(text, true);

    // 2. Thinking indicator
    const thinkingBubble = document.createElement("div");
    thinkingBubble.className = "demo-bubble dml-bubble dml-thinking";
    thinkingBubble.innerHTML = `
      <span>Dame un momento</span>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    demoStream.appendChild(thinkingBubble);
    demoStream.scrollTop = demoStream.scrollHeight;

    // 3. Response arrival after brief realistic pause
    setTimeout(() => {
      thinkingBubble.remove();

      const match = matchScenario(text);
      const encodedMsg = encodeURIComponent(`Hola Dame La Letra, necesito: "${text}" en Louisville.`);
      const waUrl = `${DML_WA_BASE}?text=${encodedMsg}`;

      const resultBubble = document.createElement("div");
      resultBubble.className = "demo-bubble dml-bubble";
      resultBubble.innerHTML = `
        <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--accent-light);">Listo.</div>
        <div>Encontramos una opción para resolver esto en Louisville:</div>
        <div class="demo-result-card">
          <div class="demo-result-header">🟢 CONFIRMADO EN LA RED</div>
          <div class="demo-result-title">${match.provider}</div>
          <div class="demo-result-meta">📍 ${match.eta} · 💵 ${match.price}</div>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-primary btn-small" style="width: 100%; text-align: center; text-decoration: none;">
            💬 Conectar por WhatsApp (+1 502-673-1333)
          </a>
        </div>
      `;
      demoStream.appendChild(resultBubble);
      demoStream.scrollTop = demoStream.scrollHeight;
    }, 550);
  }

  if (demoSendBtn) {
    demoSendBtn.addEventListener("click", () => handleDemoSubmit());
  }

  if (demoInput) {
    demoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleDemoSubmit();
    });
  }

  demoChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-text");
      handleDemoSubmit(text);
    });
  });

  // =========================================================================
  // 2. MODAL CONTROLLER (Concierge & Pro Onboarding)
  // =========================================================================
  const modalConcierge = document.getElementById("modal-concierge");
  const modalPro = document.getElementById("modal-pro");
  const openConciergeBtns = document.querySelectorAll(".btn-open-concierge");
  const openProBtns = document.querySelectorAll(".btn-open-pro");
  const closeModalBtns = document.querySelectorAll(".modal-close-btn");
  const modalBackdrops = document.querySelectorAll(".modal-backdrop");

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  openConciergeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(modalConcierge);
    });
  });

  openProBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(modalPro);
    });
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const backdrop = btn.closest(".modal-backdrop");
      closeModal(backdrop);
    });
  });

  modalBackdrops.forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modalBackdrops.forEach(b => closeModal(b));
    }
  });

  // =========================================================================
  // 3. FORM ACTIONS
  // =========================================================================
  const conciergeForm = document.getElementById("form-concierge");
  if (conciergeForm) {
    conciergeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const needText = document.getElementById("concierge-need-input").value.trim();
      if (!needText) return;
      const waUrl = `${DML_WA_BASE}?text=${encodeURIComponent(`Hola Dame La Letra, necesito: "${needText}" en Louisville, KY.`)}`;
      window.open(waUrl, "_blank");
      closeModal(modalConcierge);
    });
  }

  const proForm = document.getElementById("form-pro");
  if (proForm) {
    proForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("pro-name-input").value.trim();
      const trade = document.getElementById("pro-trade-input").value.trim();
      const phone = document.getElementById("pro-phone-input").value.trim();
      
      const proMsg = encodeURIComponent(`Hola Dame La Letra, quiero unir mi negocio a la red en Louisville.\nNombre: ${name}\nOficio/Servicio: ${trade}\nTeléfono: ${phone}`);
      const waUrl = `${DML_WA_BASE}?text=${proMsg}`;
      window.open(waUrl, "_blank");
      closeModal(modalPro);
    });
  }
});
