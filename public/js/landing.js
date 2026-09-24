/**
 * DAME LA LETRA — Official Brand Landing Experience
 * Interactive Editorial Console, Modal Controller, and Direct Connection Gateway
 */

document.addEventListener("DOMContentLoaded", () => {
  const DML_PHONE = "+15026731333";
  const DML_WA_BASE = "https://wa.me/15026731333";

  // =========================================================================
  // 1. EDITORIAL DEMO CONSOLE CONTROLLER
  // =========================================================================
  const userSpeechEl = document.getElementById("demo-user-speech");
  const dmlSpeechEl = document.getElementById("demo-dml-speech");
  const matchBoxEl = document.getElementById("demo-match-box");
  const proNameEl = document.getElementById("demo-pro-name");
  const proMetaEl = document.getElementById("demo-pro-meta");
  const customInputEl = document.getElementById("demo-custom-input");
  const customBtnEl = document.getElementById("demo-custom-btn");
  const pillBtns = document.querySelectorAll(".demo-pill-btn");

  const DEMO_SCENARIOS = {
    "goma": {
      quote: '"Se me ponchó la goma en Dixie Hwy."',
      reply: '"Listo. Roberto (Gomas & Grúa 502) está a unos 15 minutos en Shively."',
      proName: "Roberto González — Asistencia Vial & Gomas",
      proMeta: "📍 Shively / Dixie Hwy · ⏱️ Llegada en ~15-20 min · 💵 $65 - $80",
      queryText: "conectar con Roberto para asistencia vial en Dixie Hwy"
    },
    "aire": {
      quote: '"El aire está prendido pero no enfría."',
      reply: '"Listo. Carlos Ruiz (HVAC / Aire) tiene disponibilidad para diagnóstico hoy."',
      proName: "Carlos Ruiz — HVAC & Climatización Louisville",
      proMeta: "📍 Zona Metropolitana Louisville · ⏱️ Hoy después de las 12 PM · 💵 Diagnóstico $75",
      queryText: "conectar con Carlos Ruiz para revisión de aire acondicionado"
    },
    "arbol": {
      quote: '"Necesito alguien que corte un árbol en el patio."',
      reply: '"Listo. Yoelvis Silva (Árboles & Yard) tiene cuadrilla y grúa disponible hoy."',
      proName: "Yoelvis Silva — Árboles, Poda & Yard Service",
      proMeta: "📍 Louisville & Alrededores · ⏱️ Estimado gratuito hoy · 💵 Según tamaño",
      queryText: "conectar con Yoelvis Silva para poda de árbol"
    },
    "comida": {
      quote: '"¿Quién hace comida criolla para 50 personas el sábado?"',
      reply: '"Listo. Encontramos servicio de catering con capacidad para eventos este fin de semana."',
      proName: "Sabor Criollo — Catering & Eventos Louisville",
      proMeta: "📍 Jefferson County · ⏱️ Reserva para fin de semana · 💵 Menú personalizado",
      queryText: "conectar con catering para comida criolla para 50 personas"
    },
    "default": {
      quote: '"Necesito resolver un servicio en Louisville."',
      reply: '"Listo. Encontramos a un profesional verificado de la red local para atenderte."',
      proName: "Profesional Verificado de la Red DML",
      proMeta: "📍 Louisville, KY · ⏱️ Respuesta en menos de 20 min · 💵 Tarifa directa",
      queryText: "asistencia de servicio local"
    }
  };

  function parseScenario(text) {
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
    return {
      quote: `"${text}"`,
      reply: '"Listo. Encontramos una opción adecuada en Louisville para tu solicitud."',
      proName: "Proveedor Verificado para: " + text.slice(0, 30),
      proMeta: "📍 Red Local Louisville · ⏱️ Disponibilidad confirmada · 💵 Trato directo",
      queryText: text
    };
  }

  function displayScenario(scenario) {
    if (!userSpeechEl || !dmlSpeechEl) return;

    // 1. Update user question
    userSpeechEl.textContent = scenario.quote;

    // 2. Cinematic transition: "Dame un momento..."
    dmlSpeechEl.textContent = '"Dame un momento..."';
    dmlSpeechEl.style.opacity = "0.6";
    if (matchBoxEl) matchBoxEl.style.display = "none";

    // 3. Reveal final response after 450ms
    setTimeout(() => {
      dmlSpeechEl.textContent = scenario.reply;
      dmlSpeechEl.style.opacity = "1";

      if (proNameEl) proNameEl.textContent = scenario.proName;
      if (proMetaEl) proMetaEl.textContent = scenario.proMeta;

      if (matchBoxEl) {
        matchBoxEl.style.display = "block";
        const link = matchBoxEl.querySelector("a");
        if (link) {
          link.href = `${DML_WA_BASE}?text=${encodeURIComponent(`Hola Dame La Letra, necesito: "${scenario.queryText}" en Louisville, KY.`)}`;
        }
      }
    }, 450);
  }

  pillBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text");
      const scenario = parseScenario(text);
      displayScenario(scenario);
    });
  });

  if (customBtnEl && customInputEl) {
    customBtnEl.addEventListener("click", () => {
      const val = customInputEl.value.trim();
      if (val) {
        const scenario = parseScenario(val);
        displayScenario(scenario);
        customInputEl.value = "";
      }
    });

    customInputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = customInputEl.value.trim();
        if (val) {
          const scenario = parseScenario(val);
          displayScenario(scenario);
          customInputEl.value = "";
        }
      }
    });
  }

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
  // 3. FORM HANDLERS
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
